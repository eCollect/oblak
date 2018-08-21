'use strict';

const path = require('path');
const fs = require('fs');

const JSON5 = require('json5');

const clone = obj => JSON.parse(JSON.stringify(obj));

const safeParseFile = (filePath) => {
	if (!filePath || !fs.existsSync(filePath))
		return {};

	try {
		return JSON5.parse(fs.readFileSync(filePath, 'utf8'));
	} catch (e) {
		return {};
	}
};

module.exports = (env, configDir, base = {}, override = {}) => ({
	...clone(base),
	...safeParseFile(path.join(configDir, 'config.json5')),
	...safeParseFile(path.join(configDir, `config.${env}.json5`)),
	...clone(override),
});
