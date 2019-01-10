'use strict';

const ElasticReadStream = require('./ElasticReadStream');
const ElasticGetStream = require('./ElasticGetStream');

const queryParser = require('../../../../queryParser');


class ElasticGetQuery {
	constructor(id, { client, index }) {
		this.client = client;
		this.index = index;
		this.id = id;
	}

	then(resolve, reject) {
		return this.exec().then(resolve, reject);
	}

	catch(handler) {
		return this.exec().catch(handler);
	}

	exec() {
		return this.client.get({
			index: this.index,
			type: this.index,
			id: this.id,
		});
	}

	stream() {
		return new ElasticGetStream(this.client, this.index, this.id);
	}
}

class ElasticSearchQuery {
	constructor(body, { client, index }) {
		this.client = client;
		this.index = index;
		this.body = body;
	}

	then(resolve, reject) {
		return this.exec().then(resolve, reject);
	}

	catch(handler) {
		return this.exec().catch(handler);
	}

	exec() {
		return this.client.search({
			index: this.index,
			type: this.index,
			body: this.body,
		});
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

	get(id) {
		return new ElasticGetQuery(id, this);
	}

	query(query) {
		const body = queryParser.translate.elastic(query);
		return new ElasticSearchQuery(body, this);
	}
}


module.exports = ElasticQueryExecutor;
