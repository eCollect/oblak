'use strict';

const partOf = (subset, superset) => {
	if (subset === true)
		return true;

	if (typeof subset !== 'object' || typeof superset !== 'object' || (Boolean(subset) && !superset))
		return false;

	return Object.keys(subset).every((key) => {
		const subsetValue = subset[key];
		const supersetValue = superset[key];

		if (typeof supersetValue === 'object' && supersetValue !== null && subsetValue !== null)
			return partOf(subsetValue, supersetValue);
		return subsetValue === supersetValue;
	});
};

module.exports = partOf;
