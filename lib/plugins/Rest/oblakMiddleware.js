'use strict';

module.exports = wireApi => (req, res, next) => {
	req.getApp = () => wireApi.get({ some: 'metadata' });
	next();
};
