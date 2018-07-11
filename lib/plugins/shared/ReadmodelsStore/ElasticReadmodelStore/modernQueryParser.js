'use strict';

const querystring = require('querystring');

const ELASTIC_OPERATOR_MAPPING = {
	'<': 'lt',
	'>': 'gt',
	'<=': 'lte',
	'>=': 'gte',
};

const OPERATORS = {
	EQ: '=',
	LT: '<',
	GT: '>',
	LTE: '<=',
	GTE: '>=',
};

const OPERATORS_MAPPING = Object.entries(OPERATORS).reduce((mapping, [key, value]) => {
	mapping[value] = key;
	return mapping;
}, {});

const parseValue = (val) => {
	if (typeof val === 'string')
		return val.split(',').map(v => v.trim());
	if (Array.isArray(val))
		return val;
	return val;
};

const parseKey = (key, paramValue) => {
	if (paramValue)
		return {
			key: paramKey,
			op: OPERATORS.EQ,
			value: parseValue(paramValue),
		};
	const [, op = OPERATORS.EQ, value] = paramKey.match(/^([><]=?|!?=|)(.*)/);
	if (!(op in OPERATORS_MAPPING))
		throw new Error(`invalid operator ${op}`);
	return {
		key,
		op,
		value,
	};
};

const term = (field, operator, value) => {
	return { term: { [field]: value } };
};

const range = (field, operator, value) => {
	operator = ELASTIC_OPERATOR_MAPPING[operator];
	return { range: { [field]: { [operator]: value } } };
};


const caster = {
	filter({ key, op, value }) {
		if (op === OPERATORS.EQ)
			return term(key, op, value);
		return range(key, op, value);
	},
}

const parse = (qs) => {
	const params = (typeof qs === 'string') ? querystring.parse(qs) : qs;
	const {
		from,
		size,
		aggs,
		q,
		...queryFilter
	} = params;

	let filter = [];

	if (queryFilter)
		filter = Object.entries(queryFilter).reduce((acc, [key, value]) => {
			acc.push(caster.filter(parseKey(key, value)));
			return acc;
		}, []);
};

module.exports = parse;
