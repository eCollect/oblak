'use strict';

const { Readable } = require('stream');

class ElasticReadableStream extends Readable {
	constructor(client, index, body) {
		super({ objectMode: true });
		this.client = client;
		this.index = index;

		this.body = body;
		this.size = body.size || 10;
		this.from = body.from || 0;
		this.total = -1;
		this._next = true;

		this._hits = [];
		this._current = 0;
	}

	_read() {
		this._current += 1;
	}

	_fetchNextPage() {
		this.client.search({
			index,
			type: index,
			body: this.body,
		}, (err, res) => {
			this._current = 0;
			if (err) {
				this.emit('error', err);
				return this.push(null);
			}
			this.total = resp.hits.total;
			this._hits = resp.hits.hits;
		});
	}
}
