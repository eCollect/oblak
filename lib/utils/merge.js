'use strict';

const merge = require('lodash.merge');
const mergeWith = require('lodash.mergewith');
const union = require('lodash.union');

const mergeWithArrays = (...params) => mergeWith(...params, (t, s) => {
	if (Array.isArray(t) && Array.isArray(s))
		return union(t, s);
	return undefined;
});


module.exports = {
	merge,
	mergeWith,
	mergeWithArrays,
};
