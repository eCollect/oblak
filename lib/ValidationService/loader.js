'use strict';

const fs = require('fs');
const path = require('path');

const { isExtensionSupported } = require('../utils/fs/multiLoad');

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

		if (!fs.statSync(serviceFile).isFile())
			return;

		const extname = path.extname(serviceFile);
		const extension = extname.substr(1);

		if (!isExtensionSupported(extension))
			return;

		const schemaName = `/${prefix}${path.basename(serviceFile, extname)}`;

		if (schemas[schemaName])
			throw new Error(`Schmea : ${schemaName} exists in two variants : [ ${extension}, ${schemas[schemaName].extension} ]`);

		schemas[schemaName] = {
			path: serviceFile,
			extension,
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
