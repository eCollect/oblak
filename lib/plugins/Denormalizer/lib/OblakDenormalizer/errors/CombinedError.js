const OblakError = require('../../../../../tools/errors/OblakError');

module.exports = class CombinedError extends OblakError {
	constructor(message, errors) {
		if (errors.every( ({ message}) => message === errors[0].message))
			message = errors[0].message;
		super(message, 400, true);
		this.data = errors;
	}
};
