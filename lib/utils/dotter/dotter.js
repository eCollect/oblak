'use strict';

const set = require('./set');
const get = require('./get');
const { clear } = require('./shared');


module.exports = {
	set,
	get,
	clear,
};
