'use strict';

const bodyBuilder = require('bodybuilder');
const filterParser = require('./filter');

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
			body.query('query_string', { query });
	},
};

const parse = ({
	sort = [], filter = {}, from = 0, size = 100, q,
} = {}) => {
	const body = bodyBuilder();

	translate.filter(filter, body);
	translate.q(q, body);

	translate.from(from, body);
	translate.size(size, body);
	translate.sort(sort, body);

	return body.build();
};

module.exports = parse;
