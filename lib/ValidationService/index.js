'use strict';

const Ajv = require('ajv');
const fs = require('fs');

const loader = require('./loader');

class ValidationService {
	constructor({ validation, config: { ajvOptions } }) {
		this._validation = validation;
		this.ajv = new Ajv({
			allErrors: true,
			extendRefs: true,
			errorDataPath: 'property',
			unknownFormats: 'ignore',
			useDefaults: 'true',
			format: 'full',
			multipleOfPrecision: 4, // this is needed because integer division is not precise
		});

		this.loadFormats(validation.formats);
		this.ajv.loadSchema = async uri => this.loadSchema(uri);
	}

	loadSchema(uri) {
		if (!uri.startsWith('/'))
			uri = `/${uri}`;

		if (this._validation.schemas[uri])
			return JSON.parse(fs.readFileSync(this._validation.schemas[uri].path));
		throw new Error(`Schema ${uri} not found!`);
	}

	addFormat(name, options) {
		return this.ajv.addFormat(name, options);
	}

	loadFormats(formats) {
		return Object.values(formats).forEach((format) => {
			const { name, options } = require(format.path);
			return this.addFormat(name, options);
		});
	}

	async getValidatorFunction(schema) {
		if (typeof schema === 'string')
			schema = this.loadSchema(schema);
		return this.ajv.compileAsync(schema);
	}

	async validate(schema, data) {
		const fn = await this.getValidatorFunction(schema);
		return fn(data);
	}
}

ValidationService.loader = loader;

module.exports = ValidationService;
