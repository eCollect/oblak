'use strict';

const ExtensibleError = require('./ExtensibleError');

module.exports = class ConflictError extends ExtensibleError {
	constructor(message, errorCode) {
		super(message);
		this.message = message || 'Conflict';
		this.statusCode = 409;
		this.errorCode = errorCode || 409;
	}
};
