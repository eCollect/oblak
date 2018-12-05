'use strict';

/**
 * @extends Error
 */
class BuilderError extends Error {
	constructor(reason, { section, filename } = {}) {
		super(reason);
		this.name = this.constructor.name;
		this.isOperational = true;
		this.isOblakError = true;
		this.reason = reason;
		this.section = section;
		this.filename = filename;

		this.message = `(${reason})\n`;
		if (section)
			this.message += `    at ${section}`;
		if (filename)
			this.message += ` (${filename}:1:1)`;

		Error.captureStackTrace(this, this.constructor);
	}
}

module.exports = BuilderError;
