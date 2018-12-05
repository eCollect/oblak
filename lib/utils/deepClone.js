'use strict';

/**
 * Adds a value to the copy Array
 *
 * @api private
 */
function addArray(copy, key, value) {
	copy.push(value);
	return copy[copy.length - 1];
}

/**
 * Adds a value to the copy object
 *
 * @api private
 */
function addObject(copy, key, value) {
	copy[key] = value;
	return copy[key];
}


/**
 * Walks an object recursivley
 *
 * @api private
 */
function walk(target, copy, add) {
	Object.keys(target).forEach((key) => {
		const obj = target[key];
		if (obj instanceof Date)
			return add(copy, key, new Date(obj.getTime()));

		if (obj instanceof Function)
			return add(copy, key, obj);

		if (obj instanceof Array)
			return walk(obj, add(copy, key, []), addArray);

		if (obj instanceof Object)
			return walk(obj, add(copy, key, {}), addObject);

		return add(copy, key, obj);
	});

	return copy;
}


/**
 * Deep copy objects and arrays
 *
 * @param {Object/Array} target
 * @return {Object/Array} copy
 * @api public
 */
module.exports = function deepClone(target) {
	if (/number|string|boolean/.test(typeof target))
		return target;

	if (target instanceof Date)
		return new Date(target.getTime());

	return target instanceof Array ? walk(target, [], addArray) : walk(target, {}, addObject);
};
