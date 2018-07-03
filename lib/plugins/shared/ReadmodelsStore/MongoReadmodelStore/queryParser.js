'use strict';

const objectAssignDeep = require('../../../../utils/objectAssignDeep');

/*
{
	filter: [
		{ range: { field: { gte: 1, lte: 2 } } },
		{ range: { field: { gte: 1 } } },
		{ terms: { field: [ 'any', 'one' ] } },
	],
	sort: [
		{ field: 'asc' },
		{ otherField: 'desc' },
	]
}
*/

const filterParsers = {
	range(filterObj) {
		const field = Object.keys(filterObj)[0];
		const {
			gte,
			lte,
			gt,
			lt,
		} = filterObj[field];
		const filter = {};
		if (gt !== undefined)
			filter.$gt = gt;
		if (gte !== undefined)
			filter.$gte = gte;
		if (lt !== undefined)
			filter.$lt = lt;
		if (lte !== undefined)
			filter.$lte = lte;
		return { [field]: filter };
	},
	terms(filterObj) {
		const field = Object.keys(filterObj)[0];
		const terms = filterObj[field];
		const filter = {};
		if (!terms || !terms.length)
			return filter;
		return { [field]: { $in: terms } };
	},
};

const filtersParser = (filters = []) => {
	if (!filters || !filters.length)
		return;
	const mongoFilters = {};
	filters.forEach((f) => {
		const type = Object.keys(f)[0];
		const parser = filterParsers[type];
		if (!parser)
			return;
		objectAssignDeep(mongoFilters, parser(f[type]));
	});
	return mongoFilters;
};

const sortMapping = {
	asc: 1,
	ascending: 1,
	desc: -1,
	descending: -1,
};

const sortsParser = (filters = []) => {
	if (!filters || !filters.length)
		return;
	const mongoSort = {};
	filters.forEach((f) => {
		const field = Object.keys(f)[0];
		const mapped = sortMapping[f[field]];
		if (!mapped)
			return;
		objectAssignDeep(mongoSort, { [field]: mapped });
	});
	return mongoSort;
};

const mongoQueryParser = ({ filter, sort, form = 0, size = 100 } = {}) => ({
	find: filtersParser(filter),
	sort: sortsParser(sort),
	skip: form,
	limit: size,
});

module.exports = mongoQueryParser;
