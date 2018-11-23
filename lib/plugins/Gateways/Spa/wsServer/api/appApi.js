'use strict';

const OblakApiMessage = require('./OblakApiMessage');

const sendToken = (socketConnection, message, wire) => {
	const { payload, correlationId } = message;
	socketConnection.token = payload;
	socketConnection.sendMessage(new OblakApiMessage({ type: 'sentToken', correlationId }));
};

module.exports = {
	sendToken,
	get handlers() {
		return {
			sendToken,
		};
	},
};
