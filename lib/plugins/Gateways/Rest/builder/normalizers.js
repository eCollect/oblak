'use strict';

const SUPPORTED_METHODS = ['get', 'post', 'put', 'delete', 'options', 'head', 'patch'];

const { mergeWithArrays } = require('../../../../utils/merge');

module.exports = {
	routeDefinition: (routeDefinition) => {
		if (Array.isArray(routeDefinition) || typeof routeDefinition === 'function' || 'handler' in routeDefinition)
			return { get: routeDefinition };

		const unsupportedMethods = Object.keys(routeDefinition).filter(method => !SUPPORTED_METHODS.includes(method));

		if (unsupportedMethods.length)
			throw new Error(`Methods [${unsupportedMethods.join(', ')}] are not supported. Only [${SUPPORTED_METHODS.join(', ')}] methods are supported.`);

		return routeDefinition;
	},
	operationDefintion: (operatioDefinitionn, schema = {}) => {
		if (Array.isArray(operatioDefinitionn) || typeof operatioDefinitionn === 'function')
			return { handler: operatioDefinitionn, schema };

		if (!('handler' in operatioDefinitionn))
			throw Error('Operation has not handler.');

		operatioDefinitionn.schema = mergeWithArrays({}, schema, operatioDefinitionn.schema);
		return operatioDefinitionn;
	},
};
