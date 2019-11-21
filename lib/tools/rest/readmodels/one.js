'use strict';

const { pipeline } = require('stream');
const schemaJsonStringify = require('fast-json-stringify');

const JSONObjectResultStream = require('../stream/JSONObjectResultStream.js');

const { oblakOperation } = require('../symbols');

const { merge } = require('../../../utils/merge');

const defaultIdRetriever = (req, model) => req.params[`${model}_id`];
const defaultMethod = 'get';

const readmodelsOneMiddleware = (
	readmodel,
	{
		id = defaultIdRetriever,
		query = null,
		schema,
	} = {},
) => {
	const responseSchema = readmodel && readmodel.schema ? { responses: { 200: { schema: readmodel.schema } } } : null;
	const endpointSchema = merge({}, responseSchema, schema);
	const stringifyFn = endpointSchema && endpointSchema.responses && endpointSchema.responses[200] && endpointSchema.responses[200].schema ? schemaJsonStringify(endpointSchema.responses[200].schema) : undefined;

	return {
		schema: endpointSchema,
		handler: (req, res, next) => {
			const modelId = id(req, readmodel.model);
			// const app = req.getApp();

			pipeline(
				req.getApp().wire.read({ type: readmodel.type, collection: readmodel.model }, req.oblakMetadata, { ...query, id: modelId }, true),
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
	[oblakOperation]: (addAction, { readmodels }) => {
		const readmodel = cmd(readmodels);

		if (!readmodel || !readmodel.model || !readmodel.type)
			throw new Error('Readmodel is required.');

		const middleware = readmodelsOneMiddleware(readmodel, options);
		return addAction ? { [defaultMethod]: middleware } : middleware;
	},
});
