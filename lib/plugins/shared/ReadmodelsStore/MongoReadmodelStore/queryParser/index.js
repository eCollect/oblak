'use strict';

const QueryBuilder = require('./QueryBuilder');

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
		body.sort(sort);
	},
	query(query, body) {
		body.query(query);
	},
};

const parse = ({
	sort = [], filter = {}, from = 0, size = 100, q = null,
} = {}) => {
	const body = new QueryBuilder();

	translate.filter(filter, body);
	translate.query(q, body);

	translate.from(from, body);
	translate.size(size, body);
	translate.sort(sort, body);

	return body;
};

module.exports = parse;
