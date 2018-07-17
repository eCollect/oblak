'use strict';

const bodyBuilder = require('bodybuilder');
const filterParser = require('../queryParser/filter');

const reduceAndFilter = (arr = [], predicate) => {
	const len = arr.length;
	let found = 0;
	if (!len)
		return undefined;

	const result = {};
	for (let i = 0; i < len; i++) {
		const it = predicate(arr[i]);
		if (it) {
			result[arr[i]] = it;
			found += 1;
		}
	}

	return found ? result : undefined;
};

const noop = () => {};

module.exports = (aggregators = {}, { aggregatorFilter = {}, aggs: queryAggs = [] } = {}) => {
	const postFilter = bodyBuilder();

	const aggs = reduceAndFilter(queryAggs, agg => {
		const factory = aggregators[agg] || noop;
		return factory();
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
}
