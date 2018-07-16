'use strict';

const { Writable, Transform } = require('stream');

const { oblakOperation } = require('../symbols');
const { parse } = require('../../../plugins/Gateways/shared/api-query-params');

const defaultMethod = 'get';

class JsonListResultsStream extends Writable {
	constructor(res) {
		super({ objectMode: true });
		this.res = res;
		this.res.writeHead(200, {
			'content-type': 'application/json',
		});
		this.first = true;
		this.prefix = '';
		this.totalJson = '';
	}

	_write(data, _, next) {
		try {
			if (this.first) {
				this.first = false;
				const json = `${JSON.stringify(data).slice(0, -1)},"data":[`;
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

const readmodelsListMiddleware = ({
	readmodel,
} = {}) => (req, res, next) => {
	const str = req.getApp().wire.read({ type: readmodel.type, collection: readmodel.model }, req.oblakMetadata, parse(req.query));
	const resStream = new JsonListResultsStream();
	str.on('error', err => next(err));
	// str.then(resp => res.json(resp), next);
	str.pipe(new JsonListResultsStream(res));
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
