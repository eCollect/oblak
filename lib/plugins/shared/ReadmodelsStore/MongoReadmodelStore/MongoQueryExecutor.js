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
			type: this.index,
			id: this.id,
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

class MongoQuery {
	constructor(query, metadata, { mapSource = true } = {}, { collection }) {
		this.collection = collection;
		this.query = query;
		this.metadata = metadata;
	}

	then(resolve, reject) {
		return this.exec().then(resolve, reject);
	}

	catch(handler) {
		return this.exec().catch(handler);
	}

	async exec() {
		// const parsedQuery = queryParser.translate.mongo(query);
		// const collection = this.collection(modelName);
		const cursor = this.collection.find(this.query.find);
		if (parsedQuery.sort)
			cursor.sort(parsedQuery.sort);
		cursor.skip(parsedQuery.from);
		cursor.limit(parsedQuery.size);

		const res = await this.client.search({
			index: this.index,
			type: this.index,
			body: this.body,
		});

		if (!res.hits.total)
			return [];

		if (this.mapSource)
			return res.hits.hits.map(h => h._source);

		return res.hits.hits;
	}

	stream() {
		return new ElasticReadStream(this.client, this.index, this.body);
	}
}

class MongoQueryExecutor {
	constructor(collection) {
		this.collection = collection;
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
}


module.exports = MongoQueryExecutor;
