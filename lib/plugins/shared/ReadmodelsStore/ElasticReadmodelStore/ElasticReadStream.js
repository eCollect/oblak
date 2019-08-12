'use strict';

const { Readable } = require('stream');

class ElasticReadableStream extends Readable {
	constructor(client, index, {
		from = 0,
		size = 10,
		...body
	}) {
		super({ objectMode: true });

		this.client = client;
		this.index = index;

		this.body = body;

		this.size = size || 10;
		this.from = from || 0;

		this.total = -1;
		this._next = true;
		this._hits = [];
		this._current = 0;
	}

	_read() {
		if (this._current >= this._hits.length) {
			if (this._next)
				return this._fetchNextPage();
			return this.push(null);
		}
		return this._shift();
	}

	_fetchNextPage() {
		this.client.search({
			index: this.index,
			// type: this.type,
			body: {
				from: this.from,
				size: this.size,
				...this.body,
			},
		}).then((resp) => {
			this._current = 0;
			this.total = resp.hits.total.value;
			this._hits = resp.hits.hits;
			this.from += this._hits.length;
			this._next = false;

			this.push({
				total: resp.hits.total.value,
				aggregations: resp.aggregations,
			});

			if (!this._hits.length)
				this.push(null);
		}, (error) => {
			this.destroy(error);
		});
	}

	safePipe(next) {
		const res = this.pipe(next);
		this.on('error', e => res.destroy(e));
		return res;
	}

	_shift() {
		this.push(this._hits[this._current]);
		this._current += 1;
	}

	_destroy(error, next) {
		this._next = false;
		this._hits = null;
		next(error);
	}
}

module.exports = ElasticReadableStream;
