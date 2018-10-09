'use strict';

const buildReadmodels = (_, { readmodels }) => {
	const readmodelsObj = {};

	Object.entries(readmodels).forEach(([typeName, typeObj]) => {
		readmodelsObj[typeName] = {};
		Object.entries(typeObj).forEach(([modelName, { schema }]) => {
			readmodelsObj[typeName][modelName] = {
				type: typeName,
				model: modelName,
				where: {},
				schema,
			};
		});
	});
	return readmodelsObj;
};

module.exports = buildReadmodels;
