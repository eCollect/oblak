'use strict';

const debugMiddleware = (err, req, res, next) => {
	res.status(err.statusCode || 500);
	const body = {};
	body.code = err.errorCode;
	body.message = err.message;
	body.data = err.toJson ? err.toJson() : null;
	body.stack = err.stack;
	res.json(body);
	next();
};

/*
const productionMiddleware = (err, req, res, next) => {
	res.status(err.statusCode || 500);
	const body = {};
	body.code = err.errorCode;
	body.data = err.toJson ? err.toJson() : null;
	body.message = err.message;
	res.json(body);
	next();
};
*/

module.exports = debugMiddleware;
