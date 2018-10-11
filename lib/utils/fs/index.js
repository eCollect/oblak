'use strict';

const path = require('path');

const { doForEach, doForEachDir, doForEachFile } = require('./doForEach');
const multiLoad = require('./multiLoad');

const firstFilenamePart = filename => path.basename(filename).split('.', 1)[0];

module.exports = {
	doForEach,
	doForEachDir,
	doForEachFile,
	multiLoad,
	firstFilenamePart,
};
