'use strict';

const truthy = () => true;
const falsey = () => false;

const ALL_WILDCARD = '*';
const DEFAULT_RULE = falsey;

const compileRule = (rule) => {
	if (rule === undefined)
		return falsey;

	if (typeof rule === 'boolean')
		return rule ? truthy : falsey;

	if (typeof rule === 'object')
		throw new Error('Wrong rule format');

	return rule;
};


const compileType = ([typeName, typeObj], { readmodelsAccess, defaultRule, rules }) => {
	const wildcardTypeName = `${typeName}.${ALL_WILDCARD}`;
	defaultRule = wildcardTypeName in readmodelsAccess ? readmodelsAccess[wildcardTypeName] : defaultRule;

	Object.keys(typeObj).forEach((modelName) => {
		const modelFullName = `${typeName}.${modelName}`;
		let rule = defaultRule;

		if (modelFullName in readmodelsAccess)
			rule = compileRule(readmodelsAccess[modelFullName]);

		rules[modelFullName] = rule;
	});
	return rules;
};

const compile = ({ readmodels }, { readmodels: readmodelsAccess = {} }) => {
	const defaultRule = ALL_WILDCARD in readmodelsAccess ? compileRule(readmodelsAccess[ALL_WILDCARD]) : DEFAULT_RULE;
	const rules = {};

	Object.entries(readmodels).forEach((type) => {
		compileType(type, { readmodelsAccess, defaultRule, rules });
	});

	return rules;
};

module.exports = compile;
