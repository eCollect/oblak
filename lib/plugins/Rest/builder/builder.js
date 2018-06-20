'use strict';

const loader = require('./loader');

// ugly
const { oblakOperation } = require('../../../tools/rest/symbols');
const apiBuilder = require('./apiBuilder');
const nornamilizeRouteDefinition = require('./normalizeRouteDefinition');

const buildOperation = (operation, api) => {
	if (operation[oblakOperation])
		return operation[oblakOperation](false, api);
	return operation;
};

const buildRoute = (route, operations, api) => {
	if (operations[oblakOperation])
		operations = nornamilizeRouteDefinition(operations[oblakOperation](true, api));

	Object.entries(operations).forEach(([method, operation]) => {
		route[method](buildOperation(operation, api));
	});
};

const buildRouter = (rest, { Router }, api) => {
	const { path, routes, ...routers } = rest;
	const router = new Router();

	Object.entries(routes).forEach(([route, operations]) => {
		buildRoute(router.route(route), operations, api);
	});

	Object.entries(routers).forEach(([route, subRouter]) => {
		route = `/${route}`;
		router.use(route, buildRouter(subRouter, { Router }, api));
	});

	return router;
};

module.exports = (rest, definitions, app, oblak, wire) => {
	const api = apiBuilder(app, oblak, wire);
	if (typeof rest === 'string' || rest instanceof String)
		rest = loader(rest, api);
	return buildRouter(rest, definitions, api);
};
