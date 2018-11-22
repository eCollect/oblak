declare module 'oblak' {
	namespace Tools {
		type SettingsFunction = (obj) => any;
		type AnyFunction = (...params) => any;

		interface Saga {
			settings: SettingsFunction;
			only: {
				ifExists: () => any;
				ifNotExists: () => any;
				if: (condition) => any;
			};
			shouldHandle: () => any;
			identifier: () => Oblak.EventIdentityDefinition;
		}

		interface Readmodels {
			settings: SettingsFunction;
			only: {
				ifExists: () => any;
				ifNotExists: () => any;
				if: (condition: Function) => any;
			};
			extendPreEvent: () => any;
			extendEvent: () => any;
			identifier: () => any;
		}

		interface Domain {
			settings: SettingsFunction;
			command: {
				only: {
					ifExists: () => any;
					ifNotExists: () => any;
					ifValidatedBy: (validator: string | object | AnyFunction) => any;
					ifState: (condition: function) => any;
					after: (rule: function) => any;
				}
			};
			event: {
				settings: SettingsFunction;
			};
		}

		interface Rest {
			command: any;
			readmodels: {
				one: any;
				list: any;
				search: any;
			};
			services: any;
			async: (middleware: (...params) => Promise<void>) => (...params) => void;
		}

	}

		interface Readmodels {
			extendEvent: (obj: any) => any;
			extendPreEvent: (obj: any) => any;
			only: {
				ifExists: () => any;
				ifNotExists: () => any;
				if: (condition) => any;
			},
			identifier: (obj: any) => any;
		}

		interface Rest {
			services: (fn: any) => any,
			readmodels: {
				one: (cmd: any, options?: any) => any;
				list: (cmd: any, options?: any) => any;
			},
			command: (cmd: any, options?: any) => any,
			async: (req: any, res?: any, next?: any) => any,
		}
	}

	interface Tools {
		saga: Tools.Saga;
		readmodels: Tools.Readmodels;
		domain: Tools.Domain;
		rest: Tools.Rest;
	}

	class Oblak {
		static tools : Tools;
	}

	export = Oblak;
}

declare namespace Oblak {
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
	}

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
	}

	type EventIdentityDefinition = string | ((event: OblakDomainEvent) => string);

	type AggregateFunction<T> = (id?: string) => T;

	namespace Data {
		interface ReadmodelCollectionEvents {
			create: string;
			update: string;
			delete: string;
			any: string;
		}

		interface DomainEvents {

		}

		interface ReadModelsEvents {

		}

		interface Events {
			domain: DomainEvents;
			readmodels: ReadModelsEvents;
		}

		interface Exports {
			events: Events;
		}
	}

	namespace Api {
		interface Writable<TCommand> {
			getDomain: () => Domain<TCommand>;
		}

		interface Readable {
			getReadmodels: () => Readmodels;
		}

		interface Base {
			getServices: () => any;
		}

		interface Domain<TCommand> {}
		interface Readmodels {}

		type Command<TPayload, TReturn> = (payload?:TPayload, metadata?:PlainObject) => TReturn;

		interface ReadmodelQuery<T> extends PromiseLike<T> {
			find: () => ReadmodelQuery<T>;
			skip: () => ReadmodelQuery<T>;
			size: () => ReadmodelQuery<T>;
		}
	}

	namespace Saga {
		interface Api extends Api.Base, Api.Readable, Api.Writable<void> {}

		interface Model {
			id: string;
			set(attribute: any, value?: any): void;
			get(attr: string): any;
			destroy(): void;
		}

		type ReactionMiddleware = (event: OblakDomainEvent, saga: Model, app: Api) => void | Promise<void>;
		type Reaction = Array<ReactionMiddleware> | ReactionMiddleware;

		interface Identity {
			[key: string]: EventIdentityDefinition;
		}

		interface Reactions {
			[key: string]: Reaction;
		}

		type Command<TPayload, TReturn> = (payload?: TPayload, metadata?: PlainObject) => TReturn;

		interface Exports {
			identity: Identity;
			reactions: Reactions;
		}
	}

	namespace Readmodel {
		interface Api extends Api.Base, Api.Readable {}

		interface Elasticsearch6IntexMappings {
			properties: any;
		}

		interface Elasticsearch6Intex {
			mappings: Elasticsearch6IntexMappings;
		}

		interface Elasticsearch6RepositorySettings {
			index: Elasticsearch6Intex;
		}

		interface MongodbRepositorySettings {
			// ToDo: indexes:
		}

		interface Model {
			id: string;
			set(attribute: any, value?: any): void;
			get(attr: string): any;
			destroy(): void;
		}

		type ReactionMiddleware = (event: OblakDomainEvent, viewmodel: Model, app: Api) => void | Promise<void>;
		type Reaction = Array<ReactionMiddleware> | ReactionMiddleware;

		interface Identity {
			[key: string]: EventIdentityDefinition;
		}

		interface Reactions {
			[key: string]: Reaction;
		}

		interface OblakAggregators {
		}

		interface OblakRepositorySettings {
			aggregators: OblakAggregators;
		}

		interface RepositorySettings {
			elasticsearch6?: Elasticsearch6RepositorySettings;
			mongodb?: MongodbRepositorySettings;
			oblak?: OblakRepositorySettings;
		}

		interface Exports {
			schema?: string;
			initialState?: PlainObject;
			identity: Identity;
			reactions: Reactions;
			repositorySettings?: RepositorySettings;
		}
	}
}
