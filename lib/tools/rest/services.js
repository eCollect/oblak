'use strict';

const { oblakOperation } = require('./symbols');

module.exports = fn => ({
	[oblakOperation]: ({ wireApi }) => fn(wireApi.get().getServices()),
});
