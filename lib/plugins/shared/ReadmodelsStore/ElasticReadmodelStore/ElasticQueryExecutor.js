'use strict';

const ElasticReadStream = require('./ElasticReadStream');
const ElasticGetStream = require('./ElasticGetStream');

const queryParser = require('../../../../queryParser');


class ElasticGetQuery {
	constructor(id, { client, index }, { returnSource = true } = {}) {
		this.client = client;
		this.index = index;
		this.id = id;
		this.returnSource = returnSource;
	}

	then(resolve, reject) {
		return this.exec().then(resolve, reject);
	}

	catch(handler) {
		return this.exec().catch(handler);
	}

	async exec() {
		const res = this.client.get({
			index: this.index,
			type: this.index,
			id: this.id,
		});

		if (!res.found)
			return null;

		if (this.returnSource)
			return res._source;

		return res;
	}

	stream() {
		return new ElasticGetStream(this.client, this.index, this.id);
	}
}

class ElasticSearchQuery {
	constructor(body, { client, index }, { returnSource = true } = {}) {
		this.client = client;
		this.index = index;
		this.body = body;
		this.returnSource = returnSource;
	}

	then(resolve, reject) {
		return this.exec().then(resolve, reject);
	}

	catch(handler) {
		return this.exec().catch(handler);
	}

	exec() {
		const res = this.client.search({
			index: this.index,
			type: this.index,
			body: this.body,
		});
		if (!res.hits.total)
			return [];
		if (this.returnSource)
			return res.hits.hits.map(h => h._source);

		return res.hits.hits;
	}

	stream() {
		return new ElasticReadStream(this.client, this.index, this.body);
	}
}


class ElasticQueryExecutor {
	constructor(client, index) {
		this.client = client;
		this.index = index;
	}

	get(id, options) {
		return new ElasticGetQuery(id, this, options);
	}

	query(query, options) {
		const body = queryParser.translate.elastic(query);
		return new ElasticSearchQuery(body, this, options);
	}
}


module.exports = ElasticQueryExecutor;
