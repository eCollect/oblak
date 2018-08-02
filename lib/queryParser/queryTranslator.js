'use strict';

const { getBody, ElasticBodyBuilder, MongoBodyBuilder } = require('./BodyBuilders');

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
			body.query('query_string', { query });
	},
};

const parse = ({
	sort = [], filter = {}, from = 0, size = 100, q,
} = {}, body) => {
	body = getBody(body);

	translate.filter(filter, body);
	translate.q(q, body);

	translate.from(from, body);
	translate.size(size, body);
	translate.sort(sort, body);

	return body.build();
};

parse.ElasticBodyBuilder = ElasticBodyBuilder;
parse.MongoBodyBuilder = MongoBodyBuilder;

module.exports = parse;
