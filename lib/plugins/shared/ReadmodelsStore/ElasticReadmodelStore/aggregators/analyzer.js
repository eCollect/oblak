'use strict';

const Aggregator = require('./Aggregator');

const firstProperty = (obj) => {
	const key = Object.keys(obj)[0];
	return [key, obj[key]];
};


module.exports = (aggregators) => {
	const fields = {};
	Object.entries(aggregators).forEach(([name, def]) => {
		const [, definition] = firstProperty(def);
		const { field } = definition;
		fields[name] = agg => new Aggregator(field, def, agg);
	});
	return fields;
};
