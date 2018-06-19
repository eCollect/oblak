'use strict';

const ExtensibleError = require('./ExtensibleError');

module.exports = () => class NotFoundError extends ExtensibleError {
	constructor(message, errorCode) {
		super(message);
		this.message = message || 'NotFound';
		this.statusCode = 404;
		this.errorCode = errorCode || 404;
	}
};

