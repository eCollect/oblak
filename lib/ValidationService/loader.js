'use strict';

const fs = require('fs');
const path = require('path');

const FORMATS_SUB_DIR = 'formats';
const SCHEMAS_SUB_DIR = 'schemas';

const loadServices = (servicesDirectory, namespace = '', schemas = {}) => {
	if (!fs.existsSync(servicesDirectory))
		return schemas;

	const prefix = namespace ? `${namespace}/` : '';

	fs.readdirSync(servicesDirectory).forEach((serviceName) => {
		const serviceFile = path.join(servicesDirectory, serviceName);

		// namespace loading
		if (fs.statSync(serviceFile).isDirectory()) {
			loadServices(serviceFile, serviceName, schemas);
			return;
		}

		if (!fs.statSync(serviceFile).isFile() || path.extname(serviceFile) !== '.json')
			return;

		schemas[`/${prefix}${path.basename(serviceFile, '.json')}`] = {
			path: serviceFile,
		};
	});

	return schemas;
};

const loadFormats = (formatsDirectory) => {
	const formats = {};
	if (!fs.existsSync(formatsDirectory))
		return formats;

	fs.readdirSync(formatsDirectory).forEach((formatName) => {
		const formatFile = path.join(formatsDirectory, formatName);

		if (!fs.statSync(formatFile).isFile() || path.extname(formatFile) !== '.js')
			return;

		formats[path.basename(formatFile, '.js')] = {
			path: formatFile,
		};
	});

	return formats;
};

module.exports = validationDirectory => ({
	formats: loadFormats(path.join(validationDirectory, FORMATS_SUB_DIR)),
	schemas: loadServices(path.join(validationDirectory, SCHEMAS_SUB_DIR)),
});
