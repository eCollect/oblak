module 'oblak' {
	namespace Tools {
		interface Saga {
			settings: (obj: any) => any;
			only: {
				ifExists: () => any;
				ifNotExists: () => any;
				if: (condition) => any;
			},
			shouldHandle: () => any;
			identifier: () => Oblak.EventIdentityDefinition;
		}
	}


	interface Tools {
		saga: Tools.Saga;
	}

	class Oblak {
		static tools : Tools;
	}

	export = Oblak;
}

namespace Oblak {
	interface PlainObject {
		[key: string]: any;
	}

	interface OblakMetadataBase {
		[key: string]: any;
		timestamp: number;
		correlationId: string;
		causationId: string;
	}

	interface OblakDomainEvent {
		payload: PlainObject;
		metadata: OblakMetadataBase;
		context: string;
		name: string;
		aggregate: {
			name: string;
			id: string;
			revision;
		};
		fullname: string;
	};

	interface OblakReadmodelEvent {
		payload: PlainObject;
		metadata: OblakMetadataBase;
		context: string;
		aggregate: {
			name: string;
			id: string;
			revision: number;
		};
		event: {
			name: string;
			id: string;
		}
		fullname: string;
	};

	type EventIdentityDefinition = string | ((event: OblakDomainEvent) => string);

	type AggregateFunction<T> = (id?: string) => T;

	namespace Saga {
		interface Api {
			getDomain: () => OblakDomain;
		}

		interface Model {
			id: string;
			set(attribute: any, value?: any): void;
			get(attr: string): any;
			destroy(): void;
		}

		type ReactionMiddleware = (event: OblakDomainEvent, saga: Model, app: Api) => void | Promise<any>;
		type Reaction = Array<ReactionMiddleware> | ReactionMiddleware;

		interface Identity {
			[key: string]: EventIdentityDefinition;
		}

		interface Rections {
			[key: string]: Reaction;
		}

		type Command = (payload?:PlainObject, metadata?:PlainObject) => void;
	}
}
