'use strict';

const resolveFrom = require('resolve-from');

module.exports = () => {
	const localFile = resolveFrom.silent(process.cwd(), 'oblak');

	return require(localFile); // eslint-disable-line
};
