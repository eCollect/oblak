'use strict';

const micromustache = require('micromustache');

module.exports = ({ type, ...baseConfig }, { name, version, config }) => {
	if (type === 'inmemory')
		return undefined;

	const dbConfig = config[type];
	const dbName = encodeURIComponent(micromustache.render(baseConfig.dbName, { name, version }));

	return {
		type,
		...dbConfig,
		...baseConfig,
		dbName,
	};
};
