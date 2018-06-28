'use strict';

const normalize = (value) => {
	try {
		return JSON.parse(value);
	} catch (ex) {
		return value;
	}
};

const processEnv = (key) => {
	/* eslint-disable no-process-env */
	if (!key)
		return Object.entries(process.env).reduce((res, [name, value]) => {
			res[name] = normalize(value);
			return res;
		}, {});

	const value = process.env[key];
	/* eslint-enable no-process-env */

	if (!value)
		return undefined;

	return normalize(value);
};

module.exports = processEnv;
