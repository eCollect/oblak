'use strict';

const fs = require('fs');
const path = require('path');

const nornamilizeRouteDefinition = (routeDefinition) => {
	if (Array.isArray(routeDefinition) || typeof routeDefinition === 'function')
		return { get: routeDefinition };

	return routeDefinition;
};

const loadRouteFile = (filePath, { routes = {} }) => {
	const route = {
		routes: {},
		path: filePath,
	};
	Object.entries(routes).forEach(([routePath, routeDefinition]) => {
		route.routes[routePath] = nornamilizeRouteDefinition(routeDefinition);
	});
	return route;
};

const loadRestApi = (restApiDirectory) => {
	const routes = {};

	fs.readdirSync(restApiDirectory).forEach((routeName) => {
		const routerFile = path.join(restApiDirectory, routeName);
		const stat = fs.statSync(routerFile);

		if (stat.isDirectory()) {
			routes[routeName] = loadRestApi(routerFile);
			return;
		}

		if (!fs.statSync(routerFile).isFile() || path.extname(routerFile) !== '.js')
			return;

		if (path.extname(routerFile) !== '.js') return;

		const baseName = path.basename(routerFile, '.js');

		// consider using only one
		if (baseName === 'index' || baseName === 'root') {
			Object.assign(routes, loadRouteFile(routerFile, require(routerFile))); // eslint-disable-line
			return;
		}

		routes[path.basename(routerFile, '.js')] = loadRouteFile(routerFile, require(routerFile)); // eslint-disable-line
	});

	return routes;
};

const loadRests = (restsDirectory, options = {}) => {
	const restApis = {};

	fs.readdirSync(restsDirectory).forEach((restName) => {
		if (!(restName in options))
			return;

		const restApiDirectory = path.join(restsDirectory, restName);

		if (!fs.statSync(restApiDirectory).isDirectory())
			return;

		restApis[restName] = loadRestApi(restApiDirectory, options);
	});

	return restApis;
};

module.exports = (directory, options) => loadRests(directory, options);
