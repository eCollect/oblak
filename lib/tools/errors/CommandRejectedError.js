'use strict';

const OblakError = require('./OblakError');
const ValidationError = require('./ValidationError');

class CommandRejectedError extends OblakError {
	constructor({ payload, command, aggregate } = {}) {
		super('Internal Server Error');
		this.message = 'Internal Server Error';
		this.statusCode = 500;
		this.errorCode = 500;
		this.payload = payload;
		this.command = command;
		this.aggregate = aggregate;
	}

	static fromEvent(event) {
		if (event.payload.validation)
			return ValidationError.formAjvError(event.payload.errors || []);
		return new CommandRejectedError(event);
	}
}

module.exports = CommandRejectedError;
