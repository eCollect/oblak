'use strict';

module.exports = (queryFilter = {}, aggregators = {}) => {
	const filter = {};
	const postFilter = {};
	Object.entries(queryFilter).forEach(([field, filter]) => {
		if (field in aggregators) {
			aggregatorFilter[field] = queryFilter;
			return;
		}
		uniqueFilter[field] = queryFilter;
	});
	return {
		uniqueFilter,
		postFilter,
	};
}
