'use strict';

const sortMapping = {
	asc: 1,
	ascending: 1,
	desc: -1,
	descending: -1,
};

const rangeMapping = {
	gt: '$gt',
	gte: '$gte',
	lt: '$lt',
	lte: '$lte',
};

class QueryBuilder {
	constructor() {
		this.filter = {};
		this.sort = {};
		this.from = 0;
		this.size = 100;
		this.q = undefined;
	}

	setSize(size) {
		this.size = size;
	}

	setFrom(from) {
		this.from = from;
	}

	setSort(sort = []) {
		if (!sort || !sort.length)
			return;
		sort.forEach((f) => {
			const field = Object.keys(f)[0];
			const mapped = sortMapping[f[field]];
			if (!mapped)
				return;
			this.sort[field] = mapped;
		});
	}

	eq(field, value) {
		this.filter[field] = { $eq: value };
	}

	in(field, value) {
		this.filter[field] = { $in: value };
	}

	q(q) {
		this.q = q;
	}

	range(field, value) {
		Object.entries(value).forEach(([key, rangeValue]) => {
			const operator = rangeMapping[key];
			if (!operator)
				return;
			this.filter[field] = this.filter[field] || {};
			this.filter[field][operator] = rangeValue;
		});
	}
}

const filterParser = ([field, value], body) => {
	if (!Array.isArray(value))
		return body.range(field, value);
	if (value.length === 1)
		return body.eq(field, value[0]);
	return body.in(field, value);
};

const translate = {
	filter: (filter = {}, body) => Object.entries(filter).forEach(f => filterParser(f, body)),
	from(from, body) {
		body.from(from);
	},
	size(size, body) {
		body.size(size);
	},
	sort(sort, body) {
		if (sort.length)
			body.sort(sort);
	},
	q(query, body) {
		if (query)
			body.q(query);
	},
};

const parse = ({
	sort = [], filter = {}, from = 0, size = 100, q,
} = {}) => {
	const body = new QueryBuilder();

	translate.filter(filter, body);
	translate.q(q, body);

	translate.from(from, body);
	translate.size(size, body);
	translate.sort(sort, body);

	return body;
};

module.exports = parse;
