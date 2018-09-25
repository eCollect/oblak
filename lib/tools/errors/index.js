'use strict';

const errors = require('require-dir')(__dirname);

errors.OblakError.errors = errors;

errors.OblakError.fromEvent = function fromEvent(event) {
	if (!event.payload || !event.payload.isOblakError || !event.payload.name || !errors[event.payload.name])
		return this.errors.CommandRejectedError.fromEvent(event);
	const Error = this.errors[event.payload.name];
	return new Error().fromEvent(event);
};


module.exports = errors;
