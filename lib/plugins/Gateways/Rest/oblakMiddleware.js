'use strict';

module.exports = wireApi => (req, res, next) => {
	req.getApp = () => wireApi.get(req.oblakMetadata || {});
	next();
};
