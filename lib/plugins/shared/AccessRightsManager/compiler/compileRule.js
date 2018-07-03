'use strict';

const { truthy } = require('./consts');

module.exports = (rule) => {
	if (rule === undefined)
		return false;

	if (typeof rule === 'boolean')
		return rule ? truthy : false;

	if (typeof rule === 'object')
		throw new Error('Wrong rule format');

	return rule;
};
