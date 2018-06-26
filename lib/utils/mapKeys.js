'use strict';

module.exports = (obj, mapper) => Object.entries(obj).reduce((resultObj, [key, value]) => {
	resultObj[mapper(key)] = value;
	return resultObj;
}, {});
