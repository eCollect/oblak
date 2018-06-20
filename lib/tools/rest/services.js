'use strict';

const { oblakOperation } = require('./symbols');

module.exports = fn => ({
	[oblakOperation]: (addAction, { wireApi }) => fn(wireApi.get().getServices()),
});
