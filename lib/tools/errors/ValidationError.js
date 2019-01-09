'use strict';

const leven = require('js-levenshtein');

const OblakError = require('./OblakError');

const AJV_BRACKETS = /\['([a-zA-Z_-]+)'\]/g;

const bestMatch = (options, entry, min = 0.5) => options.reduce((match, value) => {
	const weight = 1 / (leven(value, entry) + 1);
	if (weight >= min && weight > match.weight) {
		match.weigth = weight;
		match.value = value;
	}
	return match;
}, { value: undefined, weight: 0 }).value;

const normalizeAjvDataPath = ({ dataPath }) => {
	dataPath = dataPath.replace(new RegExp(AJV_BRACKETS), (_, prop) => `.${prop}`);
	if (dataPath.startsWith('.'))
		dataPath = dataPath.slice(1);
	return dataPath;
};

// additionalProperties
const messageGenerator = (missingPaths, path, { keyword, message }) => {
	let suggestion;
	if (keyword === 'additionalProperties')
		suggestion = bestMatch(missingPaths, path);
	return (suggestion) ? `${message}, did you mean ${suggestion}?` : message;
};

class ValidationError extends OblakError {
	constructor(modelName) {
		const message = modelName ? `${modelName} validation failed.` : 'validation failed';
		super(message);
		this.statusCode = 400;
		this.errorCode = 'validation_error';
		this.name = 'ValidationError';
		this.general = [];
		this.fields = {};
	}

	static extendError(fields = []) {
		return class ExtendedError extends this {
			constructor() {
				super();
				fields.forEach(({
					path, keyword, message, params,
				}) => this.addFieldError(path, keyword, message, params));
			}
		};
	}

	addFieldError(path, keyword, message, params) {
		if (!path)
			return this.general.push({ keyword, params, message });

		if (!this.fields[path])
			this.fields[path] = [];

		return this.fields[path].push({ keyword, params, message });
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
		const missingPaths = [];
		errors.sort((a, b) => {
			if (a.keyword === 'required')
				return -1;
			if (b.keyword === 'required')
				return 1;
			return 0;
		}).forEach((error) => {
			const path = normalizeAjvDataPath(error);
			if (error.keyword === 'required')
				missingPaths.push(path);

			return validationError.addFieldError(path, error.keyword, messageGenerator(missingPaths, path, error), error.params);
		});
		return validationError;
	}
}

module.exports = ValidationError;
