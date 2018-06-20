'use strict';

module.exports = (routeDefinition) => {
	if (Array.isArray(routeDefinition) || typeof routeDefinition === 'function')
		return { get: routeDefinition };

	return routeDefinition;
};
