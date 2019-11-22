'use strict';

const fastStrigify = require('fast-json-stringify');

const { load } = require('../utils/fs/multiLoad');

class SchemaStrigifier {
	constructor({ schemas }) {
		this._schemas = {};
		this._cache = {};

		for (const [key, { path, extension }] of Object.entries(schemas))
			Object.defineProperty(this._schemas, key, {
				get() {
					return load(path, extension, { strict: true });
				},
				enumerable: true,
				configurable: true,
			});
	}

	compile(schema) {
		if (typeof schema !== 'string')
			return fastStrigify(schema, { schema: this._schemas });
		if (!this._cache[schema])
			this._cache[schema] = fastStrigify(this._schemas[schema], { schema: this._schemas });
		return this._cache[schema];
	}
}

module.exports = SchemaStrigifier;
