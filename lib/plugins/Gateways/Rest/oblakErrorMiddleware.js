'use strict';

const headersSent = res => (typeof res.headersSent !== 'boolean' ? Boolean(res._header) : res.headersSent);
const getData = (err) => {
	if (err.data)
		return err.data;
	if (err.toJson && typeof err.toJson === 'function')
		return err.toJson();
	return undefined;
};

const debugMiddleware = (err, req, res, next) => {
	// command errors
	if (err.name === 'CommandRejectedError' && err.payload)
		err = err.payload;
	if (headersSent(res)) {
		res.socket.destroy();
		return next();
	}
	res.status(err.statusCode || 500);
	const error = {};
	error.code = err.errorCode;
	error.message = err.message;
	error.data = getData(err);
	error.stack = err.stack;
	res.json({ error });
	return next();
};
module.exports = debugMiddleware;
