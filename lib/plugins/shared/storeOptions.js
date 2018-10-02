'use strict';

const micromustache = require('micromustache');

module.exports = ({ db, type, ...baseConfig }, {
	name, version, config, appName, shortName,
}) => {
	if (db)
		type = db;

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

	// mongo
	const dbName = (baseConfig.dbName) ? micromustache.render(baseConfig.dbName, templateVars) : undefined;
	const collectionName = (baseConfig.collectionName) ? micromustache.render(baseConfig.collectionName, templateVars) : undefined;

	// elastic
	const index = (baseConfig.index) ? micromustache.render(baseConfig.index, templateVars) : undefined;
	// redis
	const prefix = (baseConfig.prefix) ? micromustache.render(baseConfig.prefix, templateVars) : undefined;

	// special cases for event sore
	const eventsCollectionName = (baseConfig.eventsCollectionName) ? micromustache.render(baseConfig.eventsCollectionName, templateVars) : undefined;
	const snapshotsCollectionName = (baseConfig.snapshotsCollectionName) ? micromustache.render(baseConfig.snapshotsCollectionName, templateVars) : undefined;
	const transactionsCollectionName = (baseConfig.transactionsCollectionName) ? micromustache.render(baseConfig.transactionsCollectionName, templateVars) : undefined;
	const positinsCollectionName = (baseConfig.positinsCollectionName) ? micromustache.render(baseConfig.positinsCollectionName, templateVars) : undefined;

	return {
		type,
		...dbConfig,
		...baseConfig,
		dbName,
		index,
		prefix,
		collectionName,
		eventsCollectionName,
		snapshotsCollectionName,
		transactionsCollectionName,
		positinsCollectionName,
	};
};
