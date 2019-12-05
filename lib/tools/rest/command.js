'use strict';

const merge = require('lodash.merge');

const { pipeline, PassThrough } = require('stream');

const JSONObjectResultStream = require('./stream/JSONObjectResultStream.js');
const { oblakOperation } = require('./symbols');

const { createMapStream } = require('../../utils/stream');

const defaultIdRetriever = req => req.params.id;
const defaultPayloadRetriever = req => req.body;
// const defaultResponseBodyRetriever = evt => evt.payload;
const defaultMethod = 'post';

const getResponseBody = (evt) => {
	if (evt.type !== 'domain')
		return evt.payload;
	return {
		aggregate: evt.aggregate,
		payload: evt.payload,
	};
};

const getStringCommand = (str, domain) => {
	const parts = str.split('.');
	if (parts.legnth < 3)
		throw new Error('Invalid command string.');

	// domain.cntext.aggregate.command
	if (parts.length === 4)
		parts.splice(0, 1);

	const [context, aggregate, command] = parts;
	return domain[context][aggregate][command];
};

const getStringEvent = (str, readmodels) => {
	const parts = str.split('.');
	if (parts.legnth < 4)
		throw new Error('Invalid command string.');

	const [type, db, collection] = parts;

	if (type !== 'readmodel')
		return { fullname: str };

	try {
		const { schema } = readmodels[db][collection];
		return {
			fullname: str,
			schema,
		};
	} catch (e) {
		return { fullname: str };
	}
};

const getSuccessSchema = (endpointSchema) => {
	if (!endpointSchema || !endpointSchema.responses || !endpointSchema.responses[200])
		return undefined;
	return endpointSchema.responses[200].schema || endpointSchema.responses[200];
};

const isTransformValid = (trans) => {
	if (typeof trans !== 'function')
		throw new Error('Route transformers must be of type funciton');
	return trans;
};

const commandMiddleware = (
	{
		command,
		event,
	},
	{
		id = defaultIdRetriever,
		payload = defaultPayloadRetriever,
		// response = defaultResponseBodyRetriever,
		schema = {},
		transforms = [],
		...options
	} = {},
	{ validationService },
) => {
	if (!command)
		throw new Error('Invalid command');

	const requestSchema = command.schema ? { body: command.schema } : null;
	const responseSchema = event && event.schema ? { responses: { 200: { schema: event.schema } } } : null;
	const endpointSchema = merge({}, responseSchema, schema);
	const successSchema = getSuccessSchema(endpointSchema);
	const stringifyFn = successSchema ? validationService.getStrigifierFunction(successSchema) : undefined;
	transforms.forEach(isTransformValid);

	return {
		...options,
		schema: merge({}, requestSchema, responseSchema, schema),
		handler: (req, res, next) => {
			const aggregateId = id(req);
			const cmdPayload = payload(req);
			const app = req.getApp();

			app.getDomain()[command.context][command.aggregate](aggregateId)[command.name](cmdPayload).await(event && event.fullname ? event.fullname : event).exec((err, result) => {
				if (err)
					return next(err);

				const writeStream = new PassThrough({ objectMode: true });

				pipeline(
					writeStream,
					...transforms.map(t => createMapStream(t, app)),
					new JSONObjectResultStream(res, { stringifyFn }),
					(e) => {
						if (e)
							next(e);
					},
				);

				writeStream.write(getResponseBody(result));
				return writeStream.end();
				// return res.json(getResponseBody(result));
			});
		},
	};
};

module.exports = (cmd, options) => ({
	[oblakOperation]: (addAction, { domain, readmodels, validationService }) => {
		const data = cmd(domain);
		if (typeof data.command === 'string')
			data.command = getStringCommand(data.command, domain);

		if (typeof data.event === 'string')
			data.event = getStringEvent(data.event, readmodels);


		const middleware = commandMiddleware(data, options, { validationService });
		return addAction ? { [defaultMethod]: middleware } : middleware;
	},
	// method: method.toLowerCase(),
});
