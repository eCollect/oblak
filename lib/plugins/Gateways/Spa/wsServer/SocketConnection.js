'use strict';

const WebSocket = require('ws');

const uuid = require('uuid/v4');

const errorHander = require('./errorHandler');


module.exports = class SocketConnection {
	constructor({
		app, wire, socket, api,
	}) {
		this.api = api;
		this.wire = wire;
		this.app = app;

		this.onCloseBind = this.onClose.bind(this);
		this.onMessageBind = this.onMessage.bind(this);

		if (socket.uniqueId)
			throw new Error('Sockets interface has changed, update oblak.');

		socket.uniqueId = uuid();

		socket.on('message', this.onMessageBind);
		socket.on('close', this.onCloseBind);

		this.subscriptions = new Map();

		this.socket = socket;
	}

	sendMessage(message) {
		if (this.socket.readyState !== WebSocket.OPEN)
			return null;

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

	onMessage(data) {
		let message;

		try {
			message = JSON.parse(data);
			this.api.handleMessage(this, message);
		} catch (ex) {
			errorHander.handle(this, message, ex);
		}
	}

	onClose() {
		this.socket.removeEventListener('message', this.onMessageBind);
		this.socket.removeEventListener('close', this.onCloseBind);
		this.subscriptions.forEach(s => s());
		this.onCloseBind = null;
		this.onCloseBind = null;
	}
};
