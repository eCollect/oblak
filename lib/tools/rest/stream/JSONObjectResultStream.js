'use strict';

const { Writable } = require('stream');
const stringify = require('fast-stringify');

class JsonObjectResultStream extends Writable {
	constructor(res, { highWaterMark = 32, stringifyFn = stringify } = {}) {
		super({ objectMode: true, highWaterMark });
		this.stringifyFn = stringify;
		this.res = res;
		this.first = true;
	}

	_write(data, _, next) {
		try {
			if (this.first) {
				this.res.writeHead(200, {
					'content-type': 'application/json',
				});
				this.first = false;
			}
			const json = this.stringifyFn(data);
			return this.res.write(json, 'utf8', next);
		} catch (e) {
			return next(e);
		}
	}

	_final(next) {
		if (this.first) // not found
			this.res.writeHead(200, {
				'content-type': 'application/json',
			});
		this.res.end();
		next();
	}
}

module.exports = JsonObjectResultStream;
