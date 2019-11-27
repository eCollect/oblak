'use strict';

const JSONListResultsStream = require('../stream/JSONListResultsStream');

const { pipeline } = require('stream');

const { createMapStream } = require('../../../utils/stream');

const { merge } = require('../../../utils/merge');

const { oblakOperation } = require('../symbols');
const { parse } = require('../../../plugins/Gateways/shared/api-query-params');

const defaultMethod = 'get';

const getItemSchema = (schema, readmodel) => {
	if (schema && schema.responses && schema.responses[200])
		return schema.responses[200];
	if (readmodel && readmodel.schema)
		return readmodel.schema;
	return null;
};

const listModelSchema = itemsSchema => ({
	properties: {
		total: {
			type: 'integer',
			example: 0,
		},
		data: {
			type: 'array',
			items: typeof itemsSchema === 'string' ? { $ref: itemsSchema } : itemsSchema,
		},
	},
});

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

const readmodelsListMiddleware = (
	readmodel,
	{
		schema = {},
		query = null,
		transforms = [],
	} = {},
	{ validationService },
) => {
	const itemSchmea = getItemSchema(schema, readmodel);
	const responseSchema = itemSchmea ? { responses: { 200: { schema: listModelSchema(itemSchmea) } } } : null;

	const endpointSchema = merge({}, responseSchema, schema);
	const successSchema = getSuccessSchema(endpointSchema);
	const stringifyFn = successSchema ? validationService.getStrigifierFunction(successSchema) : undefined;
	transforms.forEach(isTransformValid);

	return {
		schema: merge({}, schema, responseSchema),
		handler: (req, res, next) => {
			const app = req.getApp();
			pipeline(
				app.wire.read({ type: readmodel.type, collection: readmodel.model }, req.oblakMetadata, parse({ ...req.query, ...query })),
				...transforms.map(t => createMapStream(t, app, { skipFirst: 1 })),
				new JSONListResultsStream(res, { mode: JSONListResultsStream.MODES.STATS, stringifyFn }),
				(e) => {
					if (e)
						next(e);
				},
			);
		},
	};
};

module.exports = (cmd, options) => ({
	[oblakOperation]: (addAction, { readmodels, validationService }) => {
		const readmodel = cmd(readmodels);

		if (!readmodel || !readmodel.model || !readmodel.type)
			throw new Error('Readmodel is required.');

		const middleware = readmodelsListMiddleware(readmodel, options, { validationService });
		return addAction ? { [defaultMethod]: middleware } : middleware;
	},
});
