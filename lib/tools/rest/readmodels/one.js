'use strict';

const { pipeline } = require('stream');

const JSONObjectResultStream = require('../stream/JSONObjectResultStream.js');
const { oblakOperation } = require('../symbols');

const { createMapStream } = require('../../../utils/stream');

const { merge } = require('../../../utils/merge');

const defaultIdRetriever = (req, model) => req.params[`${model}_id`];
const defaultMethod = 'get';

const isTransformValid = (trans) => {
	if (typeof trans !== 'function')
		throw new Error('Route transformers must be of type funciton');
	return trans;
};

const getSuccessSchema = (endpointSchema) => {
	if (!endpointSchema || !endpointSchema.responses || !endpointSchema.responses[200])
		return undefined;
	return endpointSchema.responses[200].schema || endpointSchema.responses[200];
};

const readmodelsOneMiddleware = (
	readmodel,
	{
		id = defaultIdRetriever,
		query = null,
		schema,
		transforms = [],
	} = {},
	{ validationService },
) => {
	const responseSchema = readmodel && readmodel.schema ? { responses: { 200: { schema: readmodel.schema } } } : null;
	const endpointSchema = merge({}, responseSchema, schema);
	const successSchema = getSuccessSchema(endpointSchema);
	const stringifyFn = successSchema ? validationService.getStrigifierFunction(successSchema) : undefined;
	transforms.forEach(isTransformValid);

	return {
		schema: endpointSchema,
		handler: (req, res, next) => {
			const modelId = id(req, readmodel.model);
			const app = req.getApp();

			pipeline(
				app.wire.read({ type: readmodel.type, collection: readmodel.model }, req.oblakMetadata, { ...query, id: modelId }, true),
				...transforms.map(t => createMapStream(t, app)),
				new JSONObjectResultStream(res, { stringifyFn }),
				(e) => {
					if (e)
						next(e);
				},
			);

			/*
			app.getReadmodels()[readmodel.type][readmodel.model]().findOne({ ...query, id: modelId }).exec((err, result) => {
				if (err)
					return next(err);

				if (result === null)
					return next(new app.errors.NotFoundError());

				delete result._id;
				return res.json(result);
			});
			*/
		},
	};
};

module.exports = (cmd, options) => ({
	[oblakOperation]: (addAction, { readmodels, validationService }) => {
		const readmodel = cmd(readmodels);

		if (!readmodel || !readmodel.model || !readmodel.type)
			throw new Error('Readmodel is required.');

		const middleware = readmodelsOneMiddleware(readmodel, options, { validationService });
		return addAction ? { [defaultMethod]: middleware } : middleware;
	},
});
