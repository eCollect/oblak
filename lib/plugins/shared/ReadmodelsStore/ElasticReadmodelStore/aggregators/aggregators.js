'use strict';

const bodyBuilder = require('bodybuilder');
const filterParser = require('./filterParser');

const { noop } = require('../../../../../utils');

const reduceAndFilter = (arr = [], predicate) => {
	const len = arr.length;
	let found = 0;
	if (!len)
		return undefined;

	const result = {};
	for (let i = 0; i < len; i++) {
		const it = predicate(arr[i]);
		if (it && it.value) {
			result[it.key] = it.value;
			found += 1;
		}
	}

	return found ? result : undefined;
};

module.exports = (aggregators = {}, { aggregatorFilter = {}, aggs: queryAggs = [] } = {}) => {
	const postFilter = bodyBuilder();

	const aggs = reduceAndFilter(queryAggs, (agg) => {
		const aggName = agg.name || agg;
		const factory = aggregators[aggName] || noop;
		return {
			key: aggName,
			value: factory(agg),
		};
	});

	Object.entries(aggregatorFilter).forEach(([name, value]) => {
		const { [name]: agg, ...rest } = aggs;

		if (!agg)
			return;

		filterParser([agg.field, value], postFilter);
		Object.values(rest).forEach(a => a.addFilter(agg.field, value));
	});

	return {
		aggs,
		postFilter: postFilter.hasFilter() ? postFilter.getFilter() : undefined,
	};
};
