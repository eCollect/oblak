'use strict';

const loader = require('./loader');

// ugly
const { oblakOperation } = require('../../../tools/rest/symbols');
const apiBuilder = require('./apiBuilder');
const normalizeRouteDefinition = require('./normalizeRouteDefinition');

const buildOperation = (operation, api) => {
	if (operation[oblakOperation])
		return operation[oblakOperation](false, api);
	return operation;
};

const buildRoute = (route, operations, api) => {
	if (operations[oblakOperation])
		operations = normalizeRouteDefinition(operations[oblakOperation](true, api));

	Object.entries(operations).forEach(([method, operation]) => {
		route[method](buildOperation(operation, api));
	});
};

const buildRouter = (rest, { Router }, api) => {
	let { before = [], routes = {}, after = [] } = require(rest.path); // eslint-disable-line
	const { routes: _, path, ...routers } = rest;
	const router = new Router();

	if (!Array.isArray(before))
		before = [before];

	if (before && before.length)
		router.use(before.map(m => buildOperation(m, api)));

	Object.entries(routes).forEach(([route, operations]) => {
		buildRoute(router.route(route), normalizeRouteDefinition(operations), api);
	});

	Object.entries(routers).forEach(([route, subRouter]) => {
		route = `/${route}`;
		router.use(route, buildRouter(subRouter, { Router }, api));
	});

	if (!Array.isArray(after))
		after = [after];

	if (after && after.length)
		router.use(after.map(m => buildOperation(m, api)));

	return router;
};

module.exports = (rest, definitions, app, oblak, wire) => {
	const api = apiBuilder(app, oblak, wire);
	if (typeof rest === 'string' || rest instanceof String)
		rest = loader(rest, api);
	return buildRouter(rest.routes, definitions, api);
};
