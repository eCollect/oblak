'use strict';

const merge = require('lodash.merge');

const validFindKeys = {
	sort: true,
	filter: true,
	from: true,
	size: true,
	q: true,
};

const isFindValid = (find) => {
	if (!find)
		return true;
	for (const key of Object.keys(find))
		if (!validFindKeys[key])
			return false;
	return true;
};

const getQuery = (query) => {
	if (query)
		return query;
	return {
		sort: [],
		filter: {},
		from: 0,
		size: 100,
		q: null,
	};
};

const getExecutor = (executor, id, query, raw, metadata, options) => {
	if (raw)
		return executor.raw(raw, metadata, options);

	if (id && !query)
		return executor.get(id, metadata, options);

	query = id ? merge(getQuery(query), { _id: id }) : getQuery(query);

	return executor.query(query, metadata, options);
};

class QueryBuilder {
	constructor(executor, metadata, id) {
		this._executor = executor;
		this._metadata = metadata;
		this._id = id;
		this._raw = null;
		this._query = null;
		this._options = {};
	}

	options(options = {}) {
		this._options = merge(this._options, options);
		return this;
	}

	base() {
		return this._executor.base();
	}

	raw(raw) {
		this._raw = raw;
		return this;
	}

	find(query) {
		if (!isFindValid(query))
			throw new Error(`Invalid .find statement ${JSON.stringify(query)}`);
		this._query = merge(getQuery(this._query), query);
		return this;
	}

	q(q) {
		this._query = merge(getQuery(this._query), { q });
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
		return getExecutor(this._executor, this._id, this._query, this._raw, this._metadata, this._options).exec();
	}

	then(onfulfilled, onrejected) {
		return this.exec().then(onfulfilled, onrejected);
	}

	catch(onrejected) {
		return this.exec().catch(onrejected);
	}

	stream() {
		return getExecutor(this._executor, this._id, this._query, this._raw, this._metadata, this._options).stream();
	}
}

module.exports = QueryBuilder;
