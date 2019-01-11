'use strict';

const { promisify } = require('util');
const { pipeline } = require('stream');

const asnycPipeline = promisify(pipeline);

module.exports = {
	pipeline: asnycPipeline,
};
