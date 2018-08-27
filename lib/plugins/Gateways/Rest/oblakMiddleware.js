'use strict';

module.exports = wireApi => (req, res, next) => {
	req.oblakApp = wireApi.name;
	req.getApp = () => wireApi.get(req.oblakMetadata || {});
	next();
};
