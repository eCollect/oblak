'use strict';

const fs = require('fs');
const path = require('path');

const normalizeRouteDefinition = require('./normalizeRouteDefinition');

const ROUTES_SUB_DIR = 'routes';
// const MIDDLEWARES_SUB_DIR = 'middlewares';

const loadRouteFile = (filePath, { routes = {} }) => {
	const route = {
		routes: {},
		path: filePath,
	};
	Object.entries(routes).forEach(([routePath, routeDefinition]) => {
		route.routes[routePath] = normalizeRouteDefinition(routeDefinition);
	});
	return route;
};


const loadRestApiRoutes = (restApiRoutesDirectory) => {
	const routes = {};

	if (!fs.existsSync(restApiRoutesDirectory))
		return routes;

	fs.readdirSync(restApiRoutesDirectory).forEach((routeName) => {
		const routerFile = path.join(restApiRoutesDirectory, routeName);
		const stat = fs.statSync(routerFile);

		if (stat.isDirectory()) {
			routes[routeName] = loadRestApiRoutes(routerFile);
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

const loadRestApi = (restApiDirectory) => {
	const api = {};
	api.routes = loadRestApiRoutes(path.join(restApiDirectory, ROUTES_SUB_DIR));
	return api;
};

const loadRests = (restsDirectory, options = {}) => {
	const restAPIs = {};

	fs.readdirSync(restsDirectory).forEach((restName) => {
		if (!(restName in options))
			return;

		const restApiDirectory = path.join(restsDirectory, restName);

		if (!fs.statSync(restApiDirectory).isDirectory())
			return;

		restAPIs[restName] = loadRestApi(restApiDirectory, options);
	});

	return restAPIs;
};

module.exports = (directory, options) => loadRests(directory, options);
