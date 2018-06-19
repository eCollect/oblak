'use strict';

const ExtensibleError = require('./ExtensibleError');

class ValidatorError {
	constructor(path, message, type, value) {
		this.path = path;
		this.message = message;
		this.type = type;
		this.value = value;
	}
}

module.exports = class ValidationError extends ExtensibleError {
	constructor(modelName) {
		const message = modelName ? `${modelName} validation failed.` : 'validation failed';
		super(message);

		this.modelName = modelName;
		this.statusCode = 400;
		this._message = message;
		this.errors = {};
		this.name = 'ValidationError';
	}

	addFieldError(fieldName = '__object__', message = '', type = '') {
		if (fieldName === '')
			fieldName = '__object__';

		if (!this.errors[fieldName])
			this.errors[fieldName] = [];

		this.errors[fieldName].push(new ValidatorError(fieldName, message, type));
	}

	toJson() {
		const data = ValidationError._generateData(this);
		return {
			message: data.generalMessage || undefined,
			fields: data.fieldMessages,
		};
	}

	get message() {
		return this._message + ValidationError._generateMessage(this);
	}

	static deserialize(object) {
		const error = new ValidationError(object.modelName);
		error._message = object._message;
		error.errors = object.errors;
		return error;
	}

	static fromAjvErrors(errorsArray = [], modelName = '') {
		const error = new ValidationError(modelName);
		errorsArray.forEach((err) => {
			const { keyword } = err;
			const path = err.dataPath.startsWith('.') ? err.dataPath.slice(1) : err.dataPath;
			return error.addFieldError(path, err.message, keyword);
		});
		return error;
	}

	static _generateData(err) {
		const keys = Object.keys(err.errors || {});
		const len = keys.length;
		const fieldMessages = {};
		const fieldMsg = [];
		let generalMessage = '';

		for (let i = 0; i < len; ++i) {
			const key = keys[i];
			if (err === err.errors[key])
				continue;

			if (key === '__object__') {
				generalMessage = err.errors[key].map(x => x.message).join(', ');
			} else {
				fieldMessages[key] = {
					message: err.errors[key][0].message, // .map(x => x.message).join(', '),
					type: err.errors[key][0].type,
				};
				fieldMsg.push(`${key}: ${err.errors[key].map(x => x.message).join(', ')}`);
			}
		}

		const message = generalMessage ? [generalMessage, fieldMsg.join(' | ')].join(' | ') : fieldMsg.join(' | ');
		return { fieldMessages, generalMessage, message };
	}


	static _generateMessage(err) {
		const data = ValidationError._generateData(err);
		return data.message;
	}
};
