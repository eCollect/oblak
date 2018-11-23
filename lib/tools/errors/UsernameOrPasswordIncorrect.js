'use strict';

const OblakError = require('./OblakError');

module.exports = class UsernameOrPasswordIncorrect extends OblakError {
	constructor(message, errorCode) {
		super(message);
		this.message = message || 'UsernameOrPasswordIncorrect';
		this.statusCode = 400;
		this.errorCode = errorCode || 400;
	}
};
