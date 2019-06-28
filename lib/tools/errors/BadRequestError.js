'use strict';

const OblakError = require('./OblakError');

module.exports = class BadRequestError extends OblakError {
	constructor({
		message = 'Bad Request',
		errorCode = 400,
		statusCode = 400,
	} = {}) {
		super(message);
		this.message = 'Bad Request';
		this.statusCode = statusCode;
		this.errorCode = errorCode;
	}

	static extendError(options) {
		return class ExtendedError extends this {
			constructor() {
				super(options);
			}
		};
	}
};
