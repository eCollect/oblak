'use strict';

const { Writable } = require('stream');
const { default: stringify } = require('fast-stringify');

const MODES = {
	ARRAY: 'array',
	STATS: 'stats',
};

const array = {
	firstRow: data => `[${stringify(data)},`,
	lastRow: ']',
};

const modes = {
	stats: {
		firstRow: data => `${stringify(data).slice(0, -1)},"data":[`,
		lastRow: ']}',
	},
	array,
};

class JsonListResultsStream extends Writable {
	constructor(res, { highWaterMark = 32, mode = 'array' } = {}) {
		super({ objectMode: true, highWaterMark });
		this.res = res;
		this.mode = modes[mode] || modes.array;
		this.first = true;
		this.prefix = '';
	}

	_write(data, _, next) {
		try {
			if (this.first) {
				this.first = false;
				const json = this.mode.firstRow(data);
				this.res.writeHead(200, {
					'content-type': 'application/json',
				});
				return this.res.write(json, 'utf8', next);
			}
			const json = this.prefix + stringify(data);
			this.prefix = ',';
			return this.res.write(json, 'utf8', next);
		} catch (e) {
			return next(e);
		}
	}

	_final(next) {
		this.res.write(this.mode.lastRow, 'utf8', (err) => {
			this.res.end();
			next(err);
		});
	}
}

JsonListResultsStream.MODES = MODES;

module.exports = JsonListResultsStream;
