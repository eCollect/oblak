'use strict';

const OblakError = require('./OblakError');

module.exports = class BadGatewayError extends OblakError {
	constructor(message, errorCode) {
		super(message);
		this.message = message || 'Bad Gateway';
		this.statusCode = 502;
		this.errorCode = errorCode || 502;
	}
};
