'use strict';

const { noop } = require('../../utils');

module.exports = fn => (req, res, next = noop) => {
	fn(req, res, next)
		// .then(() => !res.finished && next())
		.catch(next);
};
