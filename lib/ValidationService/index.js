'use strict';

const loader = require('./loader');
const builder = require('./builder');

const { load } = require('../utils/fs/multiLoad');

const normalizeUri = (uri) => {
	if (!uri.startsWith('/'))
		return `/${uri}`;
	return uri;
};

class ValidationService {
	constructor({ validation }) {
		this._validation = validation;
		this.ajv = builder(this._validation, {
			loadSchema: async uri => this.loadSchema(uri),
			allErrors: true,
			extendRefs: true,
			useDefaults: true,
			// errorDataPath: 'property',
			unknownFormats: 'ignore',
			useDefaults: 'true',
			format: 'full',
			multipleOfPrecision: 4, // this is needed because integer division is not precise
		});

		this.resolver = {
			order: 1,
			canRead: true,
			read: async uri => this.loadSchema(uri),
		};
	}

	loadSchema(uri) {
		if (uri.url)
			uri = uri.url;

		uri = normalizeUri(uri);

		if (this._validation.schemas[uri])
			return load(this._validation.schemas[uri].path, this._validation.schemas[uri].extension, { strict: true });
		throw new Error(`Schema ${uri} not found!`);
	}

	getSchemaOrReference(schema) { // eslint-disable-line
		if (typeof schema === 'string')
			return { $ref: normalizeUri(schema) };
		return schema;
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
