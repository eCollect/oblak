'use strict';

/*
const dontNotify = Symbol('Oblak:Dont:Notify');
const isNew = Symbol('Oblak:IsNew');
*/

/*

type,
id,
context,
aggregate,
event,
name,
readmodel = {},
payload = {},
metadata = {},

*/

module.exports = (context, { outgoing, Event }) => (schema) => {
	schema.methods.notify = function notify(name = 'update') {
		outgoing.write(new Event({
			type: Event.EVENT_TYPES.CRUD,
			readmodel: {
				collection: this.collection.name,
				id: this._id.toString(),
			},
			payload: this.toObject(),
			context,
			name,
		}));
	};
};
