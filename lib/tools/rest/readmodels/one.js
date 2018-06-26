'use strict';

const { oblakOperation } = require('../symbols');

const defaultIdRetriever = (req, model) => req.params[`${model}Id`];
const defaultMethod = 'get';

const readmodelsOneMiddleware = ({
	readmodel,
	id = defaultIdRetriever,
} = {}) => (req, res, next) => {
	const modelId = id(req, readmodel.model);

	req.getApp().getReadmodels()[readmodel.type][readmodel.model](modelId).exec((err, result) => {
		if (err)
			return next(err);
		return res.json(result);
	});
};

module.exports = cmd => ({
	[oblakOperation]: (addAction, { readmodels }) => {
		const { method = defaultMethod, ...data } = cmd(readmodels);

		if (!data.readmodel)
			throw new Error('Readmodel is required.');

		const middleware = readmodelsOneMiddleware(data);
		return addAction ? { [method]: middleware } : middleware;
	},
});
