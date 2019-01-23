'use strict';

const is = {
	ObjectLike: val => (val != null && typeof val === 'object'),
	Array: val => Array.isArray(val),
	Object: val => is.ObjectLike(val) && !is.Array(val) && !(val instanceof Date),
	String: path => typeof path === 'string',
	ValidObject: val => is.ObjectLike(val) || typeof val === 'function',
};

module.exports = is;
