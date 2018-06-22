'use strict';

const ExtensibleError = require('./ExtensibleError');

class ValidationError extends ExtensibleError {
	constructor(modelName) {
		const message = modelName ? `${modelName} validation failed.` : 'validation failed';
		super(message);
		this.statusCode = 400;
		this.name = 'ValidationError';
		this.general = [];
		this.fields = {};
	}

	addFieldError(path, keyword, message, params) {
		if (!path)
			return this.general.push({ keyword, params, message });

		if (!this.fields[path])
			this.fields.path = [];

		return this.fields.path.push({ keyword, params, message });
	}

	toJson() {
		return {
			message: this.message,
			general: this.general,
			fields: this.fields,
		};
	}

	static formAjvError(errors) {
		const validationError = new ValidationError();
		errors.forEach((error) => {
			const { keyword, message } = error;
			const path = error.dataPath.startsWith('.') ? error.dataPath.slice(1) : error.dataPath;
			return validationError.addFieldError(path, keyword, message, error.params);
		});
	}
}

module.exports = ValidationError;
