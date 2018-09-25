'use strict';

const OblakError = require('./OblakError');

module.exports = class ConflictError extends OblakError {
	constructor(message, errorCode) {
		super(message);
		this.message = message || 'Conflict';
		this.statusCode = 409;
		this.errorCode = errorCode || 409;
	}
};
