'use strict';

const compiler = require('./compiler');
const builder = require('./builder');

const CanAccess = require('./CanAccess');

const filterSection = (section, rules) => {
	const filteredSection = {};
	Object.entries(section).forEach(([typeName, typeObj]) => {
		Object.entries(typeObj).forEach(([itemName, itemObj]) => {
			const fullName = `${typeName}.${itemName}`;
			if (!rules[fullName])
				return;
			filteredSection[typeName] = filteredSection[typeName] || {};
			filteredSection[typeName][itemName] = itemObj;
		});
	});
	return filteredSection;
}

module.exports = class AccessRightsManager {
	constructor(oblak, access = {}) {
		if (typeof access === 'string')
			access = builder(access);

		this.rules = compiler(oblak, access);

		this.UnauthorizedError = oblak.errors.UnauthorizedError;

		this.canAccess = new CanAccess({
			rules: this.rules,
			UnauthorizedError: this.UnauthorizedError,
		});
	}


	filterOblak(oblak) {
		const filteredProps = {};
		Object.entries(this.rules).forEach(([sectionName, sectionRules]) => {
			if (!oblak[sectionName])
				return;
			filteredProps[sectionName] = filterSection(oblak[sectionName], sectionRules);
		});
		return { ...oblak, ...filteredProps };
	}

}
