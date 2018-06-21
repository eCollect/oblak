'use strict';

const fs = require('fs');
const path = require('path');

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

		services[`${prefix}${path.basename(serviceFile, '.js')}`] = {
			path: serviceFile,
		};
	});

	return services;
};

module.exports = servicesDirectory => loadServices(servicesDirectory);
