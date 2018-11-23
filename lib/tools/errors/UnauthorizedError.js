'use strict';

const OblakError = require('./OblakError');

module.exports = class UnauthorizedError extends OblakError {
	constructor(message, errorCode) {
		super(message);
		this.message = message || 'Unauthorized';
		this.statusCode = 401;
		this.errorCode = errorCode || 401;
	}
};
