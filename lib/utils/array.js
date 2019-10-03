'use strict';

const { valueop } = require('./op');

const flat = (arr, mapper = valueop) => arr.reduce((a, b) => a.concat(Array.isArray(b) ? flat(b, mapper) : mapper(b)), []);

const toFlatArray = (workflow, mapper = valueop) => {
	if (workflow === undefined)
		return [];

	if (!Array.isArray(workflow))
		return [mapper(workflow)];

	return flat(workflow, mapper);
};

const toFlatIfArray = (workflow, mapper = valueop) => {
	if (!Array.isArray(workflow))
		return mapper(workflow);

	return flat(workflow, mapper);
};

const filterAndMap = (arr, filter, map) => arr.reduce((acc, item) => {
	if (filter(item))
		acc.push(map(item));
	return acc;
}, []);

module.exports = {
	flat,
	toFlatArray,
	toFlatIfArray,
	filterAndMap,
};
