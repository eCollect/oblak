'use strict';

const transaltions = {
	eq(field, value, body) {
		body.filter('term', field, value);
		// return { term: { [field]: value } };
	},
	in(field, value, body) {
		if (value && value.length)
			body.filter('terms', field, value);
	},
	_default(field, value, body) { // we will assume its range
		body.filter('range', field, value);

		// return { range: { [field]: value } };
	},
};

module.exports = ([field, value], body) => {
	if (!Array.isArray(value))
		return transaltions._default(field, value, body);
	if (value.length === 1)
		return transaltions.eq(field, value[0], body);
	return transaltions.in(field, value, body);
};
