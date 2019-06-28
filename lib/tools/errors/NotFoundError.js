'use strict';

const OblakError = require('./OblakError');

module.exports = class NotFoundError extends OblakError {
	constructor({
		message = 'NotFound',
		errorCode = 404,
		statusCode = 404,
	} = {}) {
		super(message);
		this.message = message || 'NotFound';
		this.statusCode = statusCode;
		this.errorCode = errorCode || 404;
	}
};
