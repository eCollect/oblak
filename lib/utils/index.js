'use strict';

const { noop, valueop } = require('./op');
const mapKeys = require('./mapKeys');
const kebapCase = require('./kebapCase');
const fs = require('./fs');
const deepClone = require('./deepClone');
const array = require('./array');

module.exports = {
	deepClone,
	noop,
	valueop,
	mapKeys,
	kebapCase,
	fs,
	array,
};
