'use strict';

const OblakApiMessage = require('./OblakApiMessage');

const subscribe = (socketConnection, message, wire) => {
	const { payload, correlationId, oblakMetadata } = message;
	// todo change nanme
	let isFirst = !payload.single;
	let onData;
	let onError;
	let onEnd;

	const stream = wire.readStream(payload.readmodel, oblakMetadata, payload.query, payload.single);


	const unsubscribe = () => {
		stream.removeListener('data', onData);
		stream.removeListener('end', onEnd);
		stream.removeListener('error', onError);
		stream.end();
	};

	socketConnection.addSubscribtion(correlationId, unsubscribe);

	onData = (data) => {
		if (!isFirst)
			return socketConnection.sendMessage({ type: 'item', payload: data, correlationId });
		isFirst = false;
		return socketConnection.sendMessage({ type: 'stats', payload: data, correlationId });
	};
	onEnd = () => {
		unsubscribe();
		socketConnection.sendMessage({ type: 'finish', statusCode: 200, correlationId });
	};
	onError = (e) => {
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
	socketConnection.sendMessage(new OblakApiMessage({ type: 'unsubscribedRead', correlationId }));
};

module.exports = {
	subscribe,
	unsubscribe,
	get handlers() {
		return {
			subscribeRead: subscribe,
			unsubscribeRead: unsubscribe,
		};
	},
};
