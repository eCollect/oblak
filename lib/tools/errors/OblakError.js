'use strict';

/**
 * @extends Error
 */
class OblakError extends Error {
	constructor(message, status, isPublic) {
		super(message);
		this.name = this.constructor.name;
		this.message = message;
		this.status = status;
		this.isPublic = isPublic;
		this.isOperational = true; // This is required since bluebird 4 doesn't append it anymore.
		this.isOblakError = true; // This is required since bluebird 4 doesn't append it anymore.
		Error.captureStackTrace(this, this.constructor.name);
	}

	fromEvent({ payload }) {
		Object.assign(this, payload);
		return this;
	}
}

module.exports = OblakError;
