'use strict';

const OblakError = require('./OblakError');

module.exports = class NotFoundError extends OblakError {
	constructor(message, errorCode) {
		super(message);
		this.message = message || 'NotFound';
		this.statusCode = 404;
		this.errorCode = errorCode || 404;
	}
};
