'use strict';

const ExtensibleError = require('./ExtensibleError');

module.exports = () => class UnauthorizedError extends ExtensibleError {
	constructor(message, errorCode) {
		super(message);
		this.message = message || 'Unauthorized';
		this.statusCode = 401;
		this.errorCode = errorCode || 401;
	}
};

