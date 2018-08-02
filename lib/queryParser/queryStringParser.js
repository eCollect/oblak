'use strict';

const querystring = require('qs');

const splitAndTrim = str => str.split(',').map(i => i.trim(0));

const parseEqValues = (value) => {
	if (typeof value === 'string')
		value = splitAndTrim(value);
	return value;
};

function parseSort(value) {
	if (!value)
		value = [];
	if (typeof value === 'string')
		value = splitAndTrim(value);

	const sort = [];

	for (let x = 0; x < value.length; x++) {
		let direction = 'asc';
		let field = value[x];
		if (field.startsWith('-')) {
			direction = 'desc';
			field = field.slice(1);
		} else if (field.startsWith('+')) {
			field = field.slice(1);
		}

		sort.push({ [field]: direction });
	}


	return sort;
}

function parseAggs(value) {
	if (!value)
		value = [];
	if (typeof value === 'string')
		value = splitAndTrim(value);
	return value;
}

const parseFilter = queryFilter => Object.keys(queryFilter).reduce((filterAg, filterKey) => {
	const [, key, op] = filterKey.match(/(.*?)(?:\.(gt|gte|lt|lte))?$/);
	filterAg[key] = op ? { ...filterAg[key], [op]: queryFilter[filterKey] } : parseEqValues(queryFilter[key]);
	return filterAg;
}, {});

const parse = (qs) => {
	const params = (typeof qs === 'string') ? querystring.parse(qs) : qs;
	const {
		from = 0,
		size = 100,
		aggs = [],
		q = null,
		sort = '',
		...filter
	} = params;

	return {
		from,
		size,
		aggs: parseAggs(aggs),
		q,
		sort: parseSort(sort),
		filter: parseFilter(filter),
	};
};

module.exports = parse;
