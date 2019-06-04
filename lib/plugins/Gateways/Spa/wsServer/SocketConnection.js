'use strict';

const WebSocket = require('ws');

const uuid = require('uuid/v4');

const merge = require('lodash.merge');

const errorHander = require('./errorHandler');


module.exports = class SocketConnection {
	constructor(
		{
			app, wire, socket, api,
		},
		{
			incoming = [], outgoing = [], disconnect = [], subscribtion = [],
		} = {},
		data,
	) {
		this.api = api;
		this.wire = wire;
		this.app = app;

		this.data = data || {};

		this.middlewares = {
			incoming,
			outgoing,
			disconnect,
			subscribtion,
		};


		this.onCloseBind = this.onClose.bind(this);
		this.onMessageBind = this.onMessage.bind(this);

		if (socket.uniqueId)
			throw new Error('Sockets interface has changed, update oblak.');

		socket.uniqueId = data.socket.uniqueId;

		socket.on('message', this.onMessageBind);
		socket.on('close', this.onCloseBind);

		this.subscriptions = new Map();

		this.socket = socket;

		const { unsubscribe, stream } = wire.subscribeToEvents(true);
		this.addSubscribtion(uuid(), unsubscribe);
		stream.on('data', payload => this.onEvent(payload));
	}

	async onEvent(message) {
		const obj = {
			oblakApp: this.data.oblakApp,
			getApp: () => this.data.getApp(),
			socket: this.data.socket,
		};

		for (const middleware of this.middlewares.subscribtion)
			await middleware(message, obj);
	}

	async sendMessage(message) {
		if (this.socket.readyState !== WebSocket.OPEN)
			return null;

		message = merge(message, this.data);
		for (const middleware of this.middlewares.outgoing)
			await middleware(message, this);

		return new Promise((resolve, reject) => this.socket.send(JSON.stringify(message), (err) => {
			if (err)
				return reject(err);
			return resolve();
		}));
	}

	addSubscribtion(id, unsubscribe) {
		if (this.subscriptions.has(id))
			this.removeSubscribtion(id);
		this.subscriptions.set(id, unsubscribe);
	}

	removeSubscribtion(id) {
		const unsubscribe = this.subscriptions.get(id);
		if (unsubscribe)
			unsubscribe();
		this.subscriptions.delete(id);
	}

	removeAlladdSubscribtions() {
		for (const [id, unsubscribe] of this.subscriptions.entries()) {
			unsubscribe();
			this.subscriptions.delete(id);
		}
	}

	async onMessage(data) {
		let message;

		try {
			message = { ...JSON.parse(data), ...JSON.parse(JSON.stringify(this.data)) };
			for (const middleware of this.middlewares.incoming)
				await middleware(message);
			this.api.handleMessage(this, message);
		} catch (ex) {
			errorHander.handle(this, message, ex);
		}
	}

	async onClose() {
		this.socket.removeEventListener('message', this.onMessageBind);
		this.socket.removeEventListener('close', this.onCloseBind);
		this.subscriptions.forEach(s => s());
		this.onCloseBind = null;

		const data = {
			oblakApp: this.wire.name,
			getApp: () => this.wire.wireApi.get(this.data.oblakMetadata || {}),
			socket: this.socket,
		};

		for (const middleware of this.middlewares.disconnect)
			try {
				await middleware(data, this);
			} catch (e) {
				// do nothing
			}
	}
};
