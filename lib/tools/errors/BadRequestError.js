'use strict';

const OblakError = require('./OblakError');

module.exports = class BadRequestError extends OblakError {
	constructor(message, errorCode) {
		super(message);
		this.message = message || 'Bad Request';
		this.statusCode = 400;
		this.errorCode = errorCode || 400;
	}
};
