'use strict';

const { Readable } = require('stream');

class ElasticReadableStream extends Readable {
	constructor(client, index, id) {
		super({ objectMode: true });

		this.client = client;
		this.index = index;
		this.id = id;
	}

	_read() {
		this.client.get({
			index: this.index,
			// type: this.index,
			id: this.id,
		}, (err, res) => {
			if (err && err.status !== 404)
				return process.nextTick(() => this.emit('error', err));

			if (res || res._source)
				this.push(res);

			return this.push(null);
		});
	}

	safePipe(next) {
		const res = this.pipe(next);
		this.on('error', e => res.destroy(e));
		return res;
	}
}

module.exports = ElasticReadableStream;
