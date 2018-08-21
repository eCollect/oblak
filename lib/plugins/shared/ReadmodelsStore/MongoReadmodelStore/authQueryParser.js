'use strict';

const objectAssignDeep = require('../../../../utils/objectAssignDeep');

const fieldParsers = {
	default(field, value) {
		return { [field]: { $eq: value }};
	},
};

const parseAuthQuery = (query = {}) => {
	const mongoQuery = {}
	const parser = fieldParsers.default;
	Object.entries(query).forEach(([field, value]) => objectAssignDeep(mongoQuery, parser(field, value)));
	return mongoQuery;
};

const findWithAuth = (parsedFind = {}, authQuery = {}) => {
	if (authQuery === true)
		return parsedFind;

	return {
		$and: [
			parsedFind,
			parseAuthQuery(authQuery),
		],
	};
};

module.exports = {
	parseAuthQuery,
	findWithAuth,
};
