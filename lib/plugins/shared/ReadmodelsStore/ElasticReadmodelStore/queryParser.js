'use strict';

const transaltions = {
	filter: {
		eq(field, value) {
			return { term: { [field]: value } };
		},
		in(field, value) {
			return { terms: { [field]: value } };
		},
		_default(field, value) { // we will assume its range
			return { range: { [field]: value } };
		},
	},
};

const translate = {
	filter(filter) {
		return Object.entries(filter).map(([field, value]) => {
			if ('eq' in value)
				return transaltions.filter.eq(field, value.eq);
			if ('in' in value)
				return transaltions.filter.in(field, value.in);
			return transaltions.filter._default(field, value);
		});
	},
};

const parse = (obj) => {
	obj.filter = translate.filter(obj.filter);
	return obj;
};

module.exports = parse;
