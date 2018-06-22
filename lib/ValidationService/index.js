'use strict';

const Ajv = require('ajv');
const fs = require('fs');

const loader = require('./loader');
const ValidationError = require('../tools/errors/ValidationError');

class ValidationService {
	constructor({ validation }) {
		this._validation = validation;
		this.ajv = new Ajv({
			loadSchema: async uri => this.loadSchema(uri),
			allErrors: true,
			extendRefs: true,
			errorDataPath: 'property',
			unknownFormats: 'ignore',
			useDefaults: 'true',
			format: 'full',
			multipleOfPrecision: 4, // this is needed because integer division is not precise
		});
	}

	loadSchema(uri) {
		if (!uri.startsWith('/'))
			uri = `/${uri}`;

		if (this._validation.schemas[uri])
			return JSON.parse(fs.readFileSync(this._validation.schemas[uri].path));
		throw new Error(`Schema ${uri} not found!`);
	}

	async getValidatorFunction(schema) {
		if (typeof schema === 'string')
			schema = this.loadSchema(schema);
		return this.ajv.compileAsync(schema);
	}

	async validate(schema, data) {
		const fn = await this.getValidatorFunction(schema);
		return fn(data).catch((e) => {
			throw ValidationError.fromAjvErrors(e);
		});
	}
}

ValidationService.loader = loader;

module.exports = ValidationService;
