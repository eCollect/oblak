'use strict';

const Ajv = require('ajv');
const fs = require('fs');

const loader = require('./loader');

class ValidationService {
	constructor({ validation }) {
		this._validation = validation;
		this.ajv = new Ajv({
			loadSchema: async uri => this.loadSchema(uri),
		});
	}

	loadSchema(uri) {
		if (!uri.startsWith('/'))
			uri = `/${uri}`;

		if (this._validation.schemas[uri])
			return fs.readFileSync(this.this._validation.schemas[uri]);
		throw new Error(`Schema ${uri} not found!`);
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
