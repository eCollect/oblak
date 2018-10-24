'use strict';

const OblakApiMessage = require('./api/OblakApiMessage');

const handle = (socketConnection, { correlationId }, error = {}) => {
	const { message = 'Internal Server Error', statusCode = 500, errorCode = 500 } = error;

	const data = error.toJson ? error.toJson() : {};
	const payload = {
		message,
		errorCode,
		data,
	};

	socketConnection.sendMessage(new OblakApiMessage({
		type: 'error', payload, statusCode, correlationId,
	}));
};

module.exports = {
	handle,
};
