'use strict';

/*

class OblakError extends Error {
	constructor(message, status, isPublic) {
		super(message);
		this.name = this.constructor.name;
		this.message = message;
		this.status = status;
		this.isPublic = isPublic;
		this.isOperational = true;
		this.isOblakError = true;
		Error.captureStackTrace(this, this.constructor.name);
	}

	fromEvent({ payload }) {
		Object.assign(this, payload);
		return this;
	}
}

module.exports = OblakError;
*/
module.exports = class CombinedError extends Error {
	constructor(errors, {
		statusCode = 500,
		status = 500,
		isPublic = true,
	} = {}) {
		super(errors.map(e => e.message).join('; '));

		this.name = this.constructor.name;
		this.statusCode = statusCode;
		this.status = status;
		this.isPublic = isPublic;
		this.isOperational = true;
		this.isOblakError = true;
		this.errors = errors;
	}

	get stack() {
		return this.errors.map(err => err.stack).map('\n\n');
	}

	set stack(value) {
		return [value].concat(this.stack).join('\n\n');
	}

	static combine(errors) {
		if (!errors || !errors.length)
			return null;
		if (errors.length === 1)
			return errors[0];
		return new CombinedError(errors);
	}
};
