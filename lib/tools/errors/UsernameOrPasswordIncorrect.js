'use strict';

const ExtensibleError = require('./ExtensibleError');

module.exports = class UsernameOrPasswordIncorrect extends ExtensibleError {
	constructor(message, errorCode) {
		super(message);
		this.message = message || 'UsernameOrPasswordIncorrect';
		this.statusCode = 400;
		this.errorCode = errorCode || 400;
	}
};
