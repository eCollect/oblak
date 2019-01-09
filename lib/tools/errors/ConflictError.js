'use strict';

const OblakError = require('./OblakError');

module.exports = class ConflictError extends OblakError {
	constructor({
		message = 'Conflict',
		statusCode = 409,
		errorCode = 409,
	} = {}) {
		super(message);
		this.message = message;
		this.statusCode = statusCode;
		this.errorCode = errorCode || 409;
	}
};
