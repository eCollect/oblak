'use strict';

const fs = require('fs');
const path = require('path');

const loadOblak = require('./loadOblak');

const BOOTSTRAP_FILE_PATH = path.join(process.cwd(), './oblak.js');

module.exports = () => {
	if (!fs.existsSync(BOOTSTRAP_FILE_PATH))
		throw new Error('index.js not found in current folder...');

	// eslint-disable-next-line
	const oblak = require(BOOTSTRAP_FILE_PATH);

	const Oblak = loadOblak();

	if (!(oblak instanceof Oblak))
		throw new Error('index.js is not exporting an Oblak instance...');

	return oblak;
};
