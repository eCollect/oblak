'use strict';

const headersSent = res => (typeof res.headersSent !== 'boolean' ? Boolean(res._header) : res.headersSent);

const debugMiddleware = (err, req, res, next) => {
	if (headersSent(res)) {
		res.socket.destroy();
		return next();
	}

	res.status(err.statusCode || 500);

	const error = {};
	error.code = err.errorCode;
	error.message = err.message;
	error.data = err.data || err.toJson ? err.toJson() : null;
	error.stack = err.stack;
	res.json({ error });
	return next();
};

module.exports = debugMiddleware;
