'use strict';

/* eslint-disable */

/*

taken from : https://docs.mongodb.com/manual/reference/operator/update/

Name		 | Description
-------------|----------------------------------------------------------------------------
$currentDate | Sets the value of a field to current date, either as a Date or a Timestamp.
$inc		 | Increments the value of the field by the specified amount.
$min		 | Only updates the field if the specified value is less than the existing field value.
$max		 | Only updates the field if the specified value is greater than the existing field value.
$mul		 | Multiplies the value of the field by the specified amount.
$rename		 | Renames a field.
$set		 | Sets the value of a field in a document.
$setOnInsert | Sets the value of a field if an update results in an insert of a document. Has no effect on update operations that modify existing documents.
$unset		 | Removes the specified field from a document.

*/

module.exports = class BodyBuilder {
	/* value functions */
	set(field, value) {
		throw new Error('PayloadBuilder is an abstract class, please use implementation');
	}

	plus(field, value) {
		throw new Error('PayloadBuilder is an abstract class, please use implementation');
	}

	minus(valfield, valueue) {
		throw new Error('PayloadBuilder is an abstract class, please use implementation');
	}

	multiplyBy(field, value)  {
		throw new Error('PayloadBuilder is an abstract class, please use implementation');
	}

	divideBy(field, value) {
		throw new Error('PayloadBuilder is an abstract class, please use implementation');
	}

	min(value) {
		throw new Error('PayloadBuilder is an abstract class, please use implementation');
	}

	max(value) {
		throw new Error('PayloadBuilder is an abstract class, please use implementation');
	}

	/* array functions */
	pop() {
		throw new Error('PayloadBuilder is an abstract class, please use implementation');
	}

	push() {
		throw new Error('PayloadBuilder is an abstract class, please use implementation');
	}

	remove() {
		throw new Error('PayloadBuilder is an abstract class, please use implementation');
	}

	/* class methods */
	build() {
		throw new Error('PayloadBuilder is an abstract class, please use implementation');
	}
};
