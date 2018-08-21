'use strict';

const evaluateRule = (metadata, rule) => {
	if (!rule)
		return false;
	const query = rule(metadata);
	if (typeof query === 'boolean')
		return query;
	return { query };
}

module.exports = class CanAccess {
	constructor({
		rules, UnauthorizedError
	}) {
		this.rules = rules;
		this.UnauthorizedError = UnauthorizedError;
	}

	readmodel(modelType, modelName, metadata) {
		return evaluateRule(metadata, this.rules.readmodels[`${modelType}.${modelName}`]);
	}
}
