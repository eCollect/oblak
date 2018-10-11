'use strict';

const fs = require('fs');
const path = require('path');

const { firstFilenamePart } = require('../../../utils/fs');

const loadServices = (servicesDirectory, namespace = '', services = {}) => {
	const prefix = namespace ? `${namespace}:` : '';

	fs.readdirSync(servicesDirectory).forEach((serviceName) => {
		const serviceFile = path.join(servicesDirectory, serviceName);

		// namespace loading
		if (fs.statSync(serviceFile).isDirectory()) {
			loadServices(serviceFile, serviceName, services);
			return;
		}

		if (!fs.statSync(serviceFile).isFile() || path.extname(serviceFile) !== '.js')
			return;

		const serviceFullName = `${prefix}${firstFilenamePart(serviceFile)}`;

		if (services[serviceName])
			throw new Error(`Duplicate crud models: [${serviceFullName}] in: ${serviceFile} and ${services[serviceFullName].path}.`);

		services[serviceFullName] = {
			path: serviceFile,
		};
	});

	return services;
};

module.exports = servicesDirectory => loadServices(servicesDirectory);
