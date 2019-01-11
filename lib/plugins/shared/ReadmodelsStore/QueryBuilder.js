'use strict';

const merge = require('lodash.merge');

const getQuery = (query) => {
	if (query)
		return query;
	return {
		sort: [],
		filter: {},
		from: 0,
		size: 100,
	};
};

const getExecutor = (executor, id, query, options) => {
	if (id && !query)
		return executor.get(id, options);

	query = id ? merge(getQuery(query), { _id: id }) : getQuery(query);

	return executor.query(query, options);
};

class QueryBuilder {
	constructor(executor, metadata, id) {
		this._executor = executor;
		this._metadata = metadata;
		this._id = id;
		this._query = null;
		this._options = {};
	}

	options(options = {}) {
		this._options = merge(this._options, options);
		return this;
	}

	filter(filter) {
		this._query = merge(getQuery(this._query), { filter });
		return this;
	}

	sort(sort = []) {
		this._query = merge(getQuery(this._query), { sort });
		return this;
	}

	from(from = 0) {
		this._query = merge(getQuery(this._query), { from });
		return this;
	}

	size(size = 100) {
		this._query = merge(getQuery(this._query), { size });
		return this;
	}

	exec() {
		return getExecutor(this._executor, this._id, this._query, this._options).exec();
	}

	then(onfulfilled, onrejected) {
		return this.exec().then(onfulfilled, onrejected);
	}

	catch(onrejected) {
		return this.exec().catch(onrejected);
	}

	stream() {
		return getExecutor(this._executor, this._id, this._query, this._options).stream();
	}
}

module.exports = QueryBuilder;
