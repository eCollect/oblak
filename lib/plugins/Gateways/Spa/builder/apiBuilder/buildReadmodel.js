'use strict';

const buildReadmodels = (_, { readmodels }) => {
	const readmodelsObj = {};

	Object.entries(readmodels).forEach(([typeName, typeObj]) => {
		readmodelsObj[typeName] = {};
		Object.keys(typeObj).forEach((modelName) => {
			readmodelsObj[typeName][modelName] = {
				type: typeName,
				model: modelName,
				where: {},
			};
		});
	});
	return readmodelsObj;
};

module.exports = buildReadmodels;
