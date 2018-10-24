'use strict';

const OblakApiMessage = require('./OblakApiMessage');

const subscribe = (socketConnection, message, wire) => {
	const { payload, correlationId } = message;
	const { unsubscribe, stream } = wire.subscribeToEvents(payload.filter || {});
	socketConnection.addSubscribtion(correlationId, unsubscribe);
	socketConnection.sendMessage(new OblakApiMessage({ type: 'subscribedEvents', correlationId }));
	stream.on('data', (payload) => {
		socketConnection.sendMessage(new OblakApiMessage({ type: 'event', payload, correlationId }));
	});
};

const unsubscribe = (socketConnection, message) => {
	const { correlationId } = message;
	socketConnection.removeSubscribtion(correlationId);
	socketConnection.sendMessage(new OblakApiMessage({ type: 'unsubscribedEvents', correlationId }));
};

module.exports = {
	subscribe,
	unsubscribe,
	get handlers() {
		return {
			subscribeEvents: subscribe,
			unsubscribeEvents: unsubscribe,
		};
	},
};
