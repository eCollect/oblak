'use strict';

const { getBody, ElasticBodyBuilder, MongoBodyBuilder } = require('./BodyBuilders');

const rangeOperators = ['gt', 'gte', 'lt', 'lte'];

const isRange = (value) => {
	if (typeof value !== 'object')
		return false;
	return Object.keys(value).some(key => rangeOperators.includes(key));
};

const filterParser = ([field, value], body) => {
	if (isRange(value))
		return body.range(field, value);
	if (Array.isArray(value)) {
		if (value.length > 1)
			return body.in(field, value);
		value = value[0]; // eslint-disable-line
	}
	return body.eq(field, value);
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
			body.query(query);
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
