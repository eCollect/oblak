'use strict';

/* eslint-disable */

module.exports = class BodyBuilder {
	size(size = 100) {
		throw new Error('Body builder is an abstract class, please use implementation');
	}

	from(from = 0) {
		throw new Error('Body builder is an abstract class, please use implementation');
	}

	sort(sort = []) {
		throw new Error('Body builder is an abstract class, please use implementation');
	}

	// filter
	eq(field, value) {
		throw new Error('Body builder is an abstract class, please use implementation');
	}

	not(field, value) {
		throw new Error('Body builder is an abstract class, please use implementation');
	}

	in(field, value) {
		throw new Error('Body builder is an abstract class, please use implementation');
	}

	notIn(field, value) {
		throw new Error('Body builder is an abstract class, please use implementation');
	}

	range(field, value) {
		throw new Error('Body builder is an abstract class, please use implementation');
	}

	// field evaluation
	exists(field, value) {
		throw new Error('Body builder is an abstract class, please use implementation');
	}

	// string query
	query(query) {
		throw new Error('Body builder is an abstract class, please use implementation');
	}

	build() {
		throw new Error('Body builder is an abstract class, please use implementation');
	}
};
