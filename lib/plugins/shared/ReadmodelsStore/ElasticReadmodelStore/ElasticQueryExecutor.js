'use strict';

const ElasticReadStream = require('./ElasticReadStream');
const ElasticGetStream = require('./ElasticGetStream');

const queryParser = require('../../../../queryParser');


class ElasticGetQuery {
	constructor(id, metadata, { mapSource = true } = {}, { client, index }) {
		this.client = client;
		this.index = index;
		this.id = id;
		this.mapSource = mapSource;
	}

	then(resolve, reject) {
		return this.exec().then(resolve, reject);
	}

	catch(handler) {
		return this.exec().catch(handler);
	}

	async exec() {
		const res = await this.client.get({
			index: this.index,
			// type: this.index,
			id: this.id,
			ignore: [404],
		});

		if (!res.found)
			return [];

		if (this.mapSource)
			return [res._source];

		return [res];
	}

	stream() {
		return new ElasticGetStream(this.client, this.index, this.id);
	}
}

class ElasticSearchQuery {
	constructor(body, metadata, { mapSource = true } = {}, { client, index }) {
		this.client = client;
		this.index = index;
		this.body = body;
		this.mapSource = mapSource;
	}

	then(resolve, reject) {
		return this.exec().then(resolve, reject);
	}

	catch(handler) {
		return this.exec().catch(handler);
	}

	async exec() {
		const res = await this.client.search({
			index: this.index,
			// type: this.index,
			body: this.body,
		});

		if (!res.hits.total.value)
			return [];

		if (this.mapSource)
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

	raw(raw, metadata, options) {
		return new ElasticSearchQuery(raw, metadata, options, this);
	}

	get(id, metadata, options) {
		return new ElasticGetQuery(id, metadata, options, this);
	}

	query(query, metadata, options) {
		const body = queryParser.translate.elastic(query);
		return new ElasticSearchQuery(body, metadata, options, this);
	}

	base() {
		return {
			client: this.client,
			index: this.index,
		};
	}
}


module.exports = ElasticQueryExecutor;
