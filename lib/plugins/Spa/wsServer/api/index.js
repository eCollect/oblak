'use strict';

const eventsApi = require('./eventsApi');
const readmodelsApi = require('./readmodelsApi');

class WsApi {
	constructor({ app, wire }) {
		this.wire = wire;
		this.app = app;
		this.subscriptions = {};
		this.readmodelEventType = this.app.Event.EVENT_TYPES.DENORMALIZER;
		this.handlers = new Map();

		this.eventsApi = eventsApi;
		this.readmodelsApi = readmodelsApi;

		this.addHandlers(eventsApi.handlers);
		this.addHandlers(readmodelsApi.handlers);
	}

	addHandlers(handlers = {}) {
		Object.entries(handlers).forEach(([event, handler]) => {
			this.handlers.set(event, handler);
		});
	}

	handleMessage(socketConnection, message) {
		const { type } = message;
		const handler = this.handlers.get(type);
		if (handler)
			return handler(socketConnection, message, this.wire, this.app);
		return null;
	}

	subscribeRead(socketConnection, message) {
		const { payload, correlationId } = message;

		const stream = this.wire.readStream(payload.readmodel);

		const unsubscribe = function () {
			stream.removeListener('data', onData);
			stream.removeListener('end', onEnd);
			stream.removeListener('error', onError);
			stream.end();
		  };

		const onData = payload => socketConnection.sendMessage({ type: 'item', payload, correlationId });
		const onError = () => {
			unsubscribe();
			socketConnection.sendMessage({ type: 'finish', statusCode: 200, correlationId });
		};
		const onEnd = () => {
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
