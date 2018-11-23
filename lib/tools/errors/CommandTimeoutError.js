'use strict';

const OblakError = require('./OblakError');

class CommandTimeoutError extends OblakError {
	constructor({ payload, command, aggregate } = {}) {
		super('Internal Server Error');
		this.message = 'Internal Server Error';
		this.statusCode = 500;
		this.errorCode = 500;
		this.payload = payload;
		this.command = command;
		this.aggregate = aggregate;
	}
}

module.exports = CommandTimeoutError;
