'use strict';

const appApi = require('./appApi');
const eventsApi = require('./eventsApi');
const readmodelsApi = require('./readmodelsApi');
const commandsApi = require('./commandsApi');

class WsApi {
	constructor({ app, wire, BadRequestError }) {
		this.wire = wire;
		this.app = app;
		this.subscriptions = {};
		this.readmodelEventType = this.app.Event.EVENT_TYPES.DENORMALIZER;
		this.handlers = new Map();

		this.eventsApi = eventsApi;
		this.readmodelsApi = readmodelsApi;

		this.BadRequestError = BadRequestError;

		this.addHandlers(appApi.handlers);
		this.addHandlers(eventsApi.handlers);
		this.addHandlers(readmodelsApi.handlers);
		this.addHandlers(commandsApi.handlers);
	}

	addHandlers(handlers = {}) {
		Object.entries(handlers).forEach(([event, handler]) => {
			this.handlers.set(event, handler);
		});
	}

	handleMessage(socketConnection, message) {
		if (!message.correlationId)
			throw new this.BadRequestError('corellationId missing.');

		const { type } = message;
		const handler = this.handlers.get(type);
		if (handler)
			return handler(socketConnection, message, this.wire, this.app);
		return null;
	}

	// this is not needed anymore
	subscribeRead(socketConnection, message) {
		const { payload, correlationId } = message;

		const stream = this.wire.readStream(payload.readmodel);

		let onData;
		let onError;
		let onEnd;

		const unsubscribe = () => {
			stream.removeListener('data', onData);
			stream.removeListener('end', onEnd);
			stream.removeListener('error', onError);
			stream.end();
		};

		onData = data => socketConnection.sendMessage({ type: 'item', payload: data, correlationId });
		onError = () => {
			unsubscribe();
			socketConnection.sendMessage({ type: 'finish', statusCode: 200, correlationId });
		};
		onEnd = () => {
			unsubscribe();
			socketConnection.sendMessage({ type: 'error', statusCode: 500, correlationId });
		};

		stream.on('data', onData);
		stream.on('end', onEnd);
		stream.on('error', onError);

		socketConnection.sendMessage({ type: 'subscribeRead', correlationId });
	}
}

module.exports = WsApi;
