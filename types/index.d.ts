declare module 'oblak' {
	// helpers
	type AnyFunction<TReturn = any> = (...params) => TReturn;

	namespace Tools {
		type SettingsFunction = (obj) => any;
		// express
		type ExpressMiddleware<TReturn = void> = (req: any, res?: any, next?: any) => TReturn;
		type ExpressAsyncMiddleware = ExpressMiddleware<Promise<void>>;

		interface Domain {
			settings: SettingsFunction;
			command: {
				only: {
					ifExists: () => any;
					ifNotExists: () => any;
					ifValidatedBy: (validator: string | object | AnyFunction) => any;
					ifState: (condition: AnyFunction) => any;
					after: (rule: AnyFunction) => any;
				}
			};
			event: {
				settings: SettingsFunction;
			};
		}

		interface Readmodels {
			settings: SettingsFunction;
			extendEvent: (obj: any) => any;
			extendPreEvent: (obj: any) => any;
			only: {
				ifExists: () => any;
				ifNotExists: () => any;
				if: (condition: Function) => any;
			},
			identifier: (obj: any) => any;
		}

		interface Saga {
			settings: SettingsFunction;
			only: {
				ifExists: () => any;
				ifNotExists: () => any;
				if: (condition: Function) => any;
			};
			shouldHandle: () => any;
			identifier: () => Oblak.EventIdentityDefinition;
		}

		interface Rest {
			services: (fn: AnyFunction) => ExpressMiddleware,
			readmodels: {
				one: (cmd: any, options?: any) => ExpressMiddleware;
				list: (cmd: any, options?: any) => ExpressMiddleware;
			},
			command: (cmd: any, options?: any) => ExpressMiddleware,
			async: (asyncMiddleware: ExpressAsyncMiddleware ) => ExpressMiddleware;
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
		static debug : () => Oblak;
		use: AnyFunction;
		addHook: AnyFunction;
		run: AnyFunction<Promise<any>>;
		init: AnyFunction<Promise<any>>;
		clear: AnyFunction<Promise<any>>;
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

	interface Data extends Data.Exports {}

	namespace Api {
		interface Writable<TCommand> {
			getDomain: () => Domain<TCommand>;
		}

		interface ReadableDomain {
			getDomain: () => DomainReadable;
		}

		interface Readable {
			getReadmodels: () => Readmodels;
		}

		interface Base {
			getServices: () => any;
		}

		interface Domain<TCommand> {}
		interface DomainReadable {}
		interface Readmodels {}

		type Command<TPayload, TReturn> = (payload?:TPayload, metadata?:PlainObject) => TReturn;
		type ReadableAggregate = (id:string) => Promise<any>;

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
	interface Saga extends Saga.Exports {}

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
			indexes: Array<any>;
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
			[key: string]: any;
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
	interface Readmodel extends Readmodel.Exports {}

	namespace Domain {
		interface Api extends Api.Base, Api.Readable, Api.ReadableDomain {}

		interface Command<TPayload> {
			payload: TPayload;
			metadata: OblakMetadataBase;
		}

		interface ModelApply {
			(name: string, payload: PlainObject, metadata: OblakMetadataBase): void;
		}

		interface Model<TApply> {
			id: string;

			apply: TApply;
			/**
			 * Gets an attribute of the vm.
			 * @param attr The attribute name.
			 * @return The result value.
			 *
			 * @example:
			 *     aggregate.get('firstname'); // returns 'Jack'
			 */
			get(attr: string): any;
			/**
			  * Sets attributes for the aggregate.
			  *
			  * @example:
			  *     aggregate.set('firstname', 'Jack');
			  *     // or
			  *     aggregate.set({
			  *          firstname: 'Jack',
			  *          lastname: 'X-Man'
			  *     });
			  */
			set(attribute: any, value?: any): void;

			/**
					 * Marks this aggregate as destroyed.
					 */
			destroy(): void;

			/**
			 * Returns true if this aggregate is destroyed.
			 */
			isDestroyed(): boolean;
		}

		interface GenericModelApply extends ModelApply {
			[key: string]: (payload?: PlainObject, metadata?: OblakMetadataBase) => void;
		}

		type CommandMiddleware<TApply, TPlayload> = (command?: Command<TPlayload>, aggregate?: Model<TApply>, app?: Api) => void | Promise<void>;
		type CommandMiddlewares<TApply, TPlayload> = Array<CommandMiddleware<TApply, TPlayload>> | CommandMiddleware<TApply, TPlayload>;

		type EventMiddleware = (event?: OblakDomainEvent, aggregate?: Model<void>) => void;
		type EVentMiddlewares = Array<EventMiddleware> | EventMiddleware;

		interface Commands<TApply> {
			[key: string]: CommandMiddlewares<TApply, PlainObject>;
		}

		interface Events {
			[key: string]: EVentMiddlewares;
		}

		interface Aggregate extends Exports<GenericModelApply, Commands<GenericModelApply>> {
		}

		interface Exports<TApply, TCommands> {
			/**
			 * Aggregates initial stae
			 */
			initialState: PlainObject;
			/**
			 * Aggregate command defintion
			 */
			commands: TCommands;
			/**
			 * Your aggregate event definitions
			 */
			events: Events;
			/**
			 * Aggreagte ID Generator fuction
			 */
			idGenerator: (command?: Command<PlainObject>, app?: Api) => void | Promise<void>;
		}
	}
	interface Aggregate extends Domain.Aggregate {}
}
