'use strict';

const noop = () => ({});
const valueop = v => v;
const mapKeys = require('./mapKeys');
const kebapCase = require('./kebapCase');
const fs = require('./fs');
const deepClone = require('./deepClone');

module.exports = {
	deepClone,
	noop,
	valueop,
	mapKeys,
	kebapCase,
	fs,
};
