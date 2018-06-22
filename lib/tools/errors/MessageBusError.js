'use strict';

const ExtensibleError = require('./ExtensibleError');

module.exports = class MessageBus extends ExtensibleError {
	constructor(message) {
		super(message);
		this.name = 'MessageBusError';
	}
};
