'use strict';

class DefinitionsContainer {
	constructor({
		// eslint-disable-next-line no-shadow
		indent = 0,
	} = {}) {
		this.definitions = [];
		this.indent = indent;
	}

	interface(opts) {
		return this.push(new InterfaceGenerator({ ...opts, indent: this.indent }));
	}

	push(definition) {
		this.definitions.push(definition);
		return definition;
	}

	toString() {
		return this.definitions.reverse().map(d => d.toString()).join(newLine);
	}
}
