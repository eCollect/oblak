'use strict';

const OblakError = require('./OblakError');

module.exports = class UnauthorizedError extends OblakError {
	constructor({
		message = 'Unauthorized',
		statusCode = 401,
		errorCode = 401,
	} = {}) {
		super(message);
		this.message = message || 'Unauthorized';
		this.statusCode = statusCode;
		this.errorCode = errorCode;
	}
};
