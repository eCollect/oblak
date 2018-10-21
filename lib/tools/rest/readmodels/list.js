'use strict';

const { Writable, Transform } = require('stream');

const { merge } = require('../../../utils/merge');

const { oblakOperation } = require('../symbols');
const { parse } = require('../../../plugins/Gateways/shared/api-query-params');

const defaultMethod = 'get';

class JsonListResultsStream extends Writable {
	constructor(res) {
		super({ objectMode: true });
		this.res = res;
		this.first = true;
		this.prefix = '';
		this.totalJson = '';
	}

	_write(data, _, next) {
		try {
			if (this.first) {
				this.first = false;
				const json = `${JSON.stringify(data).slice(0, -1)},"data":[`;
				this.res.writeHead(200, {
					'content-type': 'application/json',
				});
				return this.res.write(json, 'utf8', next);
			}
			const json = this.prefix + JSON.stringify(data);
			this.totalJson += json;
			this.prefix = ',';
			return this.res.write(json, 'utf8', next);
		} catch (e) {
			return next(e);
		}
	}

	_final(next) {
		this.res.write(']}', 'utf8', (err) => {
			this.res.end();
			next(err);
		});
	}
}

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

const readmodelsListMiddleware = (
	readmodel,
	{
		schema = {},
	} = {},
) => {
	const itemSchmea = getItemSchema(schema, readmodel);
	const responseSchema = itemSchmea ? { responses: { 200: { schema: listModelSchema(itemSchmea) } } } : null;

	return {
		schema: merge({}, schema, responseSchema),
		handler: (req, res, next) => {
			const str = req.getApp().wire.read({ type: readmodel.type, collection: readmodel.model }, req.oblakMetadata, parse(req.query));
			str.on('error', err => next(err));
			// str.then(resp => res.json(resp), next);
			str.pipe(new JsonListResultsStream(res));
		},
	};
};

module.exports = (cmd, options) => ({
	[oblakOperation]: (addAction, { readmodels }) => {
		const readmodel = cmd(readmodels);

		if (!readmodel.model || !readmodel.type)
			throw new Error('Readmodel is required.');

		const middleware = readmodelsListMiddleware(readmodel, options);
		return addAction ? { [defaultMethod]: middleware } : middleware;
	},
});
