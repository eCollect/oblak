'use strict';

const OblakApiMessage = require('./OblakApiMessage');

const sendCommand = (socketConnection, message, wire) => {
	const { payload, correlationId } = message;
	payload.metadata = { ...payload.metadata, ...message.oblakMetadata };

	wire.sendCommand(new wire.app.Command(payload));
	socketConnection.sendMessage(new OblakApiMessage({ type: 'sentCommand', correlationId }));
};

module.exports = {
	sendCommand,
	get handlers() {
		return {
			sendCommand,
		};
	},
};
