'use strict';

const loader = require('./loader');

// ugly
const { oblakOperation } = require('../../../../tools/rest/symbols');
const apiBuilder = require('./apiBuilder');
const normalizers = require('./normalizers');

/**
 * Remove trailing slash from routes
 * @param {*} route
 */
const urlFormat = route => {
	if (!route)
		return route;
	// remove trailing /
	route = route.replace(/[/]+$/g, '');
	// add leading /
	if (!route.startsWith('/'))
		route = `/${route}`;
	return route;
};

/**
 * Join two routes in order to achive full path
 * @param  {...any} parts
 */
const urlJoin = (...parts) => `/${parts.map(part => part.replace(/^[/]+/g, '')).filter(p => p).join('/')}`;

const buildOperation = (operation, api) => {
	if (operation[oblakOperation])
		return operation[oblakOperation](false, api);
	return operation;
};

const buildRoute = (route, schema, operations, api, wire, uri) => {
	if (operations[oblakOperation])
		operations = normalizers.routeDefinition(operations[oblakOperation](true, api));

	Object.entries(operations).forEach(([method, operation]) => {
		operation = normalizers.operationDefintion(buildOperation(operation, api), schema);
		wire.triggerHook('onRoute', {
			uri,
			method,
			operation,
		});
		route[method](operation.handler);
	});
};

const buildRouter = (rest, { Router }, api, wire, uri = '/') => {
	let { before = [], routes = {}, after = [], schema= {} } = rest.path ? require(rest.path) : {}; // eslint-disable-line
	const { routes: _, path, ...routers } = rest;
	const router = new Router();

	if (!Array.isArray(before))
		before = [before];

	if (before && before.length)
		router.use(before.map(m => buildOperation(m, api)));

	Object.entries(routes).forEach(([route, operations]) => {
		route = urlFormat(route);
		buildRoute(router.route(route), schema, normalizers.routeDefinition(operations), api, wire, urlJoin(uri, route));
	});

	Object.entries(routers).forEach(([route, subRouter]) => {
		route = urlFormat(route);
		router.use(route, buildRouter(subRouter, { Router }, api, wire, urlJoin(uri, route)));
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
	return buildRouter(rest.routes, definitions, api, wire);
};
