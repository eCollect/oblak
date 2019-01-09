'use strict';

const ConflictError = require('./ConflictError.js');

module.exports = class UserAlreadyExistsError extends ConflictError {
	constructor() {
		super({
			errorCode: 'user_already_exists',
		});
	}
};
