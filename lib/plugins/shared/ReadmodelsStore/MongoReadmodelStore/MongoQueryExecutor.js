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
		return this.collection.find(this.query.find, this.query);
		/*
			if (this.query.sort)
				cursor.sort(this.query.sort);
			cursor.skip(this.query.from);
			cursor.limit(this.query.size);
			return cursor;
		*/
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
		console.log(body);
		return new MongoQuery(body, metadata, options, this);
	}
}


module.exports = MongoQueryExecutor;
