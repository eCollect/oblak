'use strict';

const OblakError = require('./OblakError');

module.exports = class MessageBus extends OblakError {
	constructor(message) {
		super(message);
		this.name = 'MessageBusError';
	}
};
