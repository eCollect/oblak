'use strict';

const { oblakOperation } = require('.../symbols');

const defaultIdRetriver = (req, model) => req.params[`${model}Id`];
const defaultMethod = 'post';

const readmodelsOneMiddleware = ({
	readmodel,
	id = defaultIdRetriver,
} = {}) => (req, res, next) => {
	const modelId = id(req, readmodel.model);

	req.getApp().getReadmodels()[readmodel.type][readmodel.model](modelId).exec((err, result) => {
		if (err)
			return next(err);
		return res.json(result.payload);
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
