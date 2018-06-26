'use strict';

const Ajv = require('ajv');

const loader = require('./loader');

const addFormats = (ajv, formats) => {
	Object.entries(formats).forEach(([name, value]) => {
		const validate = require(value.path); // eslint-disable-line

		if (typeof validate === 'function')
			return ajv.addFormat(name, validate);

		if (typeof validate !== 'object' || !('options' in validate) || !('validate' in validate.options) || typeof validate.options.validate !== 'function')
			throw new Error(`Unknown formatter ${value.path}.`);

		return ajv.addFormat(validate.name || name, validate.options);
	});
	return ajv;
};

const buildAjv = (validation, options = {}) => {
	if (!validation)
		throw new Error('No validation definitions supplied.');

	if (!options.loadSchema)
		throw new Error('loadSchema is required.');

	if (typeof validation === 'string')
		validation = loader(validation);

	const ajv = new Ajv({
		allErrors: true,
		extendRefs: true,
		errorDataPath: 'property',
		unknownFormats: 'ignore',
		useDefaults: 'true',
		format: 'full',
		multipleOfPrecision: 4, // this is needed because integer division is not precise
		...options,
	});

	return addFormats(ajv, validation.formats);
};

module.exports = buildAjv;
