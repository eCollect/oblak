'use strict';

const ExtensibleError = require('./ExtensibleError');

module.exports = class BadGatewayError extends ExtensibleError {
	constructor(message, errorCode) {
		super(message);
		this.message = message || 'Bad Gateway';
		this.statusCode = 502;
		this.errorCode = errorCode || 502;
	}
};
