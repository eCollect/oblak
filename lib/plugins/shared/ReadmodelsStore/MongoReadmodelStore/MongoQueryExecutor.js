'use strict';

const queryParser = require('../../../../queryParser');

class MongoQuery {
	constructor(query, metadata, options, { collection }) {
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
		return this.stream().toArray();
	}

	stream() {
		const { find = {}, options = {} } = this.query;
		return this.collection.find(find, options);
	}
}

class MongoQueryExecutor {
	constructor(collection) {
		this.collection = collection;
	}

	raw(raw, metadata, options) {
		return new MongoQuery(raw, metadata, options, this);
	}

	get(id, metadata, options) {
		return new MongoQuery({ find: { _id: id } }, metadata, options, this);
	}

	query(query, metadata, options) {
		const body = queryParser.translate.mongo(query);
		return new MongoQuery(body, metadata, options, this);
	}

	base() {
		return this.collection;
	}
}


module.exports = MongoQueryExecutor;
