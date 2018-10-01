'use strict';

const noop = () => ({});
const valueop = v => v;
const mapKeys = require('./mapKeys');
const kebapCase = require('./kebapCase');
const fs = require('./fs');

module.exports = {
	noop,
	valueop,
	mapKeys,
	kebapCase,
	fs,
};
