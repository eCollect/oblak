'use strict';

const { getBody, ElasticBodyBuilder, MongoBodyBuilder } = require('./BodyBuilders');

const notInOperators = ['ne'];
const rangeOperators = ['gt', 'gte', 'lt', 'lte'];

const isObject = value => (value !== null && typeof value === 'object');

const isNot = (value) => {
	if (!isObject(value))
		return false;
	return Object.keys(value).some(key => notInOperators.includes(key));
};

const isRange = (value) => {
	if (!isObject(value))
		return false;
	return Object.keys(value).some(key => rangeOperators.includes(key));
};

const evaluateNotClause = (field, { ne }, body) => {
	if (Array.isArray(ne)) {
		if (ne.length > 1)
			return body.notIn(field, ne);
		// eslint-disable-next-line prefer-destructuring
		ne = ne[0];
	}
	return body.not(field, ne);
};

const filterParser = ([field, value], body) => {
	if (isRange(value))
		return body.range(field, value);

	if (isNot(value))
		return evaluateNotClause(field, value, body);

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
