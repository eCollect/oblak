'use strict';

const { ALL_WILDCARD } = require('./consts');
const compileRule = require('./compileRule');

const compileType = ([typeName, typeObj], { readmodelsAccess, defaultRule, rules }) => {
	const wildcardTypeName = `${typeName}.${ALL_WILDCARD}`;
	defaultRule = wildcardTypeName in readmodelsAccess ? compileRule(readmodelsAccess[wildcardTypeName]) : defaultRule;

	Object.keys(typeObj).forEach((modelName) => {
		const modelFullName = `${typeName}.${modelName}`;
		let rule = defaultRule;

		if (modelFullName in readmodelsAccess)
			rule = compileRule(readmodelsAccess[modelFullName]);

		rules[modelFullName] = rule;
	});
	return rules;
};

const compile = ({ readmodels }, { readmodels: readmodelsAccess = {} }, defaultRule) => {
	defaultRule = ALL_WILDCARD in readmodelsAccess ? compileRule(readmodelsAccess[ALL_WILDCARD]) : defaultRule;
	const rules = {};

	Object.entries(readmodels).forEach((type) => {
		compileType(type, { readmodelsAccess, defaultRule, rules });
	});

	return rules;
};

module.exports = compile;
