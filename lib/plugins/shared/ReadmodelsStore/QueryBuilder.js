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


class QueryBuilder {
	constructor(executor, metadata, id) {
		this.executor = executor;
		this.metadata = metadata;
		this.id = id;
		this.query = null;
	}

	filter(filter) {
		this.query = merge(getQuery(this.query), filter);
		return this;
	}

	sort(sort = []) {
		this.query = merge(getQuery(this.query), { sort });
		return this;
	}

	from(from = 0) {
		this.query = merge(getQuery(this.query), { from });
		return this;
	}

	size(size = 100) {
		this.query = merge(getQuery(this.query), { size });
		return this;
	}

	exec() {
		if (this.id && !this.query)
			return this.executor.get(id).exec();

		if (this.id)
			this.query = merge(getQuery(this.query), { _id: this.id });

		return this.executor.query(id).exec();
	}

	stream() {
		if (this.id && !this.query)
			return this.executor.get(id).stream();

		if (this.id)
			this.query = merge(getQuery(this.query), { _id: this.id });

		return this.executor.query(id).stream();
	}
}

module.exports = QueryBuilder;
