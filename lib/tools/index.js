'use strict';

const domain = require('./domain');
const readmodels = require('./readmodels');
const rest = require('./rest');
const errors = require('./errors');

module.exports = {
	rest,
	domain,
	errors,
	readmodels,
};
