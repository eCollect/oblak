'use strict';

const fs = require('fs');
const path = require('path');

const loadServices = (servicesDirectory) => {
	const services = {};

	fs.readdirSync(servicesDirectory).forEach((serviceName) => {
		const serviceFile = path.join(servicesDirectory, serviceName);

		if (!fs.statSync(serviceFile).isFile() || path.extname(serviceFile) !== '.js')
			return;

		services[path.basename(serviceFile, '.js')] = {
			path: serviceFile,
		};
	});

	return services;
};


module.exports = (servicesDirectory, options) => loadServices(servicesDirectory, options);
