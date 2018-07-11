'use strict';

const { oblakOperation } = require('../symbols');

const { parse } = require('../../../plugins/Gateways/shared/api-query-params');

const defaultMethod = 'get';

const readmodelsListMiddleware = ({
	readmodel,
} = {}) => (req, res, next) => {
	req.getApp().wire.read(readmodel, req.oblakMetadata, parse(req.query)).then(result => res.json(result), next);
};

module.exports = cmd => ({
	[oblakOperation]: (addAction, { readmodels }) => {
		const { method = defaultMethod, ...data } = cmd(readmodels);

		if (!data.model || !data.type)
			throw new Error('Readmodel is required.');

		const middleware = readmodelsListMiddleware({ readmodel: data });
		return addAction ? { [method]: middleware } : middleware;
	},
});
