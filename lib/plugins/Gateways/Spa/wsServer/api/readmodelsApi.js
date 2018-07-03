'use strict';

const OblakApiMessage = require('./OblakApiMessage');

const subscribe = (socketConnection, message, wire) => {
	const { payload, correlationId } = message;

	const stream = wire.readStream(payload.readmodel, payload.query, payload.single);

	const unsubscribe = function () {
		stream.removeListener('data', onData);
		stream.removeListener('end', onEnd);
		stream.removeListener('error', onError);
		stream.end();
	  };

	socketConnection.addSubscribtion(correlationId, unsubscribe);

	const onData = payload => socketConnection.sendMessage({ type: 'item', payload, correlationId });
	const onEnd = () => {
		unsubscribe();
		socketConnection.sendMessage({ type: 'finish', statusCode: 200, correlationId });
	};
	const onError = () => {
		unsubscribe();
		socketConnection.sendMessage({ type: 'error', statusCode: 500, correlationId });
	};

	stream.on('data', onData);
	stream.on('end', onEnd);
	stream.on('error', onError);

	socketConnection.sendMessage({ type: 'subscribedRead', correlationId });
};

const unsubscribe = (socketConnection, message) => {
	const { correlationId } = message;
	socketConnection.removeSubscribtion(correlationId);
	socketConnection.sendMessage(new OblakApiMessage({ type: 'unsubscribedRead', correlationId }))
};

module.exports = {
	subscribe,
	unsubscribe,
	get handlers() {
		return {
			subscribeRead: subscribe,
			unsubscribeRead: unsubscribe,
		};
	}
};
