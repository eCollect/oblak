'use strict';

const { DEFAULT_RULE, ALL_WILDCARD } = require('./consts');

const compileRule = require('./compileRule');
const readmodels = require('./readmodels');

module.exports = (oblak, access = {}) => {
	const defaultRule = ALL_WILDCARD in access ? compileRule(access[ALL_WILDCARD]) : DEFAULT_RULE;
	return {
		readmodels: readmodels(oblak, access, defaultRule),
	};
}
