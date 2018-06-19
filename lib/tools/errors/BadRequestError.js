'use strict';

const ExtensibleError = require('./ExtensibleError');

module.exports = () => class BadRequestError extends ExtensibleError {
	constructor(message, errorCode) {
		super(message);
		this.message = message || 'Bad Request';
		this.statusCode = 400;
		this.errorCode = errorCode || 400;
	}
};

