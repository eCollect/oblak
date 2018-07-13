'use strict';

const bodyBuilder = require('bodybuilder');

const transaltions = {
	filter: {
		eq(field, value, body) {
			body.filter('term', field, value);
			// return { term: { [field]: value } };
		},
		in(field, value, body) {
			body.filter('terms', field, value);
			// return { terms: { [field]: value } };
		},
		_default(field, value, body) { // we will assume its range
			body.filter('range', field, value);

			// return { range: { [field]: value } };
		},
	},
};

const translate = {
	filter(filter = {}, body) {
		Object.entries(filter).forEach(([field, value]) => {
			if ('eq' in value)
				return transaltions.filter.eq(field, value.eq, body);
			if ('in' in value)
				return transaltions.filter.in(field, value.in, body);
			return transaltions.filter._default(field, value, body);
		});
	},
	from(from, body) {
		body.from(from);
	},
	size(size, body) {
		body.size(size);
	},
	q(query, body) {
		if (query)
			body.query('query_string', { query });
	},
};

const parse = ({
	filter = {}, from = 0, size = 100, q,
} = {}) => {
	const body = bodyBuilder();
	translate.filter(filter, body);
	translate.from(from, body);
	translate.size(size, body);
	translate.q(q, body);
	return body.build();
};

module.exports = parse;
