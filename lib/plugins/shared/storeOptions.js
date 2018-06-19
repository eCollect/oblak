'use strict';

const micromustache = require('micromustache');

module.exports = ({ type, ...baseConfig }, {
	name, version, config, appName, shortName,
}) => {
	if (type === 'inmemory')
		return undefined;

	if (typeof baseConfig === 'string')
		baseConfig = config[baseConfig][type];

	const dbConfig = config[type];
	const templateVars = {
		name,
		version,
		appName,
		shortName,
	};

	const dbName = micromustache.render(baseConfig.dbName, templateVars);
	const collectionName = (baseConfig.collectionName) ? micromustache.render(baseConfig.collectionName, templateVars) : undefined;

	// special cases for event sore
	const eventsCollectionName = (baseConfig.eventsCollectionName) ? micromustache.render(baseConfig.eventsCollectionName, templateVars) : undefined;
	const snapshotsCollectionName = (baseConfig.snapshotsCollectionName) ? micromustache.render(baseConfig.snapshotsCollectionName, templateVars) : undefined;
	const transactionsCollectionName = (baseConfig.transactionsCollectionName) ? micromustache.render(baseConfig.transactionsCollectionName, templateVars) : undefined;

	return {
		type,
		...dbConfig,
		...baseConfig,
		dbName,
		collectionName,
		eventsCollectionName,
		snapshotsCollectionName,
		transactionsCollectionName,
	};
};
