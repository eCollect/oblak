'use strict';

const UnauthorizedError = require('./UnauthorizedError');

const errorCode = 'username_or_password_incorrect';

module.exports = class UsernameOrPasswordIncorrect extends UnauthorizedError {
	constructor() {
		super({
			errorCode,
		});
	}
};
