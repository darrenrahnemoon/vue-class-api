import { getMetadata, ensureMetadata }                                                               from './reflect-metadata';
import _                                                                                             from 'lodash';
import {
	ComponentPublicInstance, ComponentInternalInstance, ComponentOptions, DebuggerEvent,
	Prop as PropOptions, Slots, WatchOptions, WatchStopHandle, computed, SetupContext, RenderFunction
} from 'vue';

// Dictionary of all the metadata names used. Changing these values will change the name of the metadata used everywhere.
export const metadataKeys = {
	watch   : '__WATCH__',
	props   : '__PROPS__',
	emits   : '__EMITS__',
	expose  : '__EXPOSE__',
	ref     : '__REF__',
	provide : '__PROVIDE__',
	inject  : '__INJECT__',
	hooks   : '__HOOKS__',
};

const excludedClassProperties = [ 'length', 'constructor', 'prototype', 'arguments', 'callee', 'caller' ];
const excludedProperties = [ 'provide', 'inject', 'name', 'props', 'emits', 'expose', 'watch', 'computed', 'mixins', '$', '$data', '$props', '$attrs', '$refs', '$slots', '$root', '$parent', '$emit', '$el', '$options' ];
const hookNames = [ 'beforeCreate', 'created', 'beforeMount', 'mounted', 'beforeUpdate', 'updated', 'activated', 'deactivated', 'beforeDestroy', 'beforeUnmount', 'destroyed', 'unmounted', 'renderTracked', 'renderTriggered', 'errorCaptured' ];
type HookName = 'beforeCreate' | 'created' | 'beforeMount' | 'mounted' | 'beforeUpdate' | 'updated' | 'activated' | 'deactivated' | 'beforeDestroy' | 'beforeUnmount' | 'destroyed' | 'unmounted' | 'renderTracked' | 'renderTriggered' | 'errorCaptured';

export interface Vue {
	$: ComponentInternalInstance;
	$data: Dictionary<any>;
	$props: Dictionary<any>;
	$attrs: Dictionary<any>;
	$refs: Dictionary<any>;
	$slots: Slots;
	$root: ComponentPublicInstance | null;
	$parent: ComponentPublicInstance | null;
	$emit: (event: string, ...args) => void;
	$el: Node | undefined;
	$options: ComponentOptions;
	$forceUpdate: () => void;
	$nextTick: <T = void>(this: T, fn?: (this: T) => void) => Promise<void>;
	$watch: (source: string | Function, cb: Function, options?: WatchOptions) => WatchStopHandle;

	provide?: Function | Dictionary<any>;
	inject?: Dictionary<any | { from?: string; default?: any }>;
	name?: string;
	props?: Dictionary<PropOptions<any>>;
	emits?: string[];
	expose?: string[];
	watch?: Dictionary<{ handler: Function } & WatchOptions>;
	computed?: Dictionary<Function | { get?: Function; set?: Function }>;

	prototype? : {
		beforeCreate?: () => void;
		created?: () => void;
		beforeMount?: () => void;
		mounted?: () => void;
		beforeUpdate?: () => void;
		updated?: () => void;
		activated?: () => void;
		deactivated?: () => void;
		beforeDestroy?: () => void;
		beforeUnmount?: () => void;
		destroyed?: () => void;
		unmounted?: () => void;
		renderTracked?: (event: DebuggerEvent) => void;
		renderTriggered?: (event: DebuggerEvent) => void;
		errorCaptured?: (error, instance: ComponentPublicInstance | null, info: string) => boolean | void;

		setup?: (props: Readonly<Dictionary<any>>, ctx: SetupContext) => RenderFunction | Dictionary<any>;
	};
}

export class Vue {}

export function Component(options: ComponentOptions = {}): any {
	return function(VueClass) {
		const instance = new VueClass();
		const staticProperties = Object.getOwnPropertyDescriptors(VueClass);
		const instanceProperties = Object.getOwnPropertyDescriptors(instance);
		const prototypeProperties = Object.getOwnPropertyDescriptors(VueClass.prototype);

		// Provide/Inject
		const provide = getMetadata(metadataKeys.provide, VueClass.prototype);
		const optionsProvide = options.provide;
		options.provide = function() {
			return {
				..._.mapValues(provide, key => computed(() => this[key])),
				...(typeof optionsProvide === 'function' ? optionsProvide() : optionsProvide),
			};
		};

		// Ensure all inject values are maps not arrays
		if (Array.isArray(options.inject)) {
			options.inject = _(options.inject).keyBy().mapValues(() => ({})).valueOf();
		}
		options.inject = { ...getMetadata(metadataKeys.inject, VueClass.prototype), ...options.inject };

		// Props
		options.props = { ...getMetadata(metadataKeys.props, VueClass.prototype),  ...options.props };

		// Computed
		options.computed = { ..._.pickBy(prototypeProperties, desc => desc.get || desc.set), ...options.computed };

		// Template Refs
		const refs = getMetadata(metadataKeys.ref, VueClass.prototype) || [];
		refs.forEach(ref => {
			options.computed[ref] = {
				get() {
					return this.$refs[ref];
				},
			};
		});

		// Data
		const dataProperties: string[] = _(instanceProperties)
			.pickBy((desc, propertyKey) =>
				!desc.get && !desc.set 							// Not a getter/setter (computed)
				&& typeof desc.value !== 'function' 			// Not a method/hook
				&& !excludedProperties.includes(propertyKey) 	// Not a component option
				&& !options.props[propertyKey] 					// Not a prop
				&& !refs.includes(propertyKey) 					// Not a ref
				&& !options.inject[propertyKey]) 				// Not an injected value
			.keys()
			.valueOf();
		const data = _.pick(instance, dataProperties);
		const optionsData = options.data;
		options.data = function(vm) {
			return { ..._.cloneDeep(data), constructor : VueClass, ...optionsData?.call(this, vm) };
		};

		// Component Name
		options.name = VueClass.name || options.name;

		// Emits
		const emits: Set<string> = getMetadata(metadataKeys.emits, VueClass.prototype) || new Set();
		options.emits?.forEach(emits.add);
		options.emits = Array.from(emits);

		// Expose
		const expose = getMetadata(metadataKeys.expose, VueClass.prototype);
		if (options.expose || expose) {
			options.expose = [ ...(expose || []), ...(options.expose || []) ]; // `undefined` would still trigger a Vue warning when assigned to options.expose
		}

		// Watchers
		options.watch = { ...getMetadata(metadataKeys.watch, VueClass.prototype), ...options.watch };

		// Methods
		options.methods = {
			..._(prototypeProperties)
				.pickBy((desc, propertyKey) => typeof desc.value === 'function' && !hookNames.includes(propertyKey))
				.mapValues(desc => desc.value).valueOf(),
			...options.methods,
		};

		const hooks = getMetadata(metadataKeys.hooks, VueClass.prototype) || {};
		hookNames.forEach(hookName => {
			const methods = hooks[hookName] || [];
			const prototypeHook = VueClass.prototype[hookName];
			if (prototypeHook) {
				methods.unshift(prototypeHook);
			}
			if (options[hookName]) {
				methods.unshift(options[hookName]);
			}
			options[hookName] = methods;
		});

		options.setup = options.setup || VueClass.prototype.setup;

		options.mixins = [ ...(VueClass.mixins || []), ...(options.mixins || []) ];

		_.forEach(staticProperties, (desc, propertyKey) => {
			if (excludedClassProperties.includes(propertyKey)) {
				return;
			}

			// Since we're assigning the static methods to options, we need to bind the static methods to the class
			if (typeof desc.value === 'function') {
				desc.value = desc.value.bind(VueClass);
			}

			Object.defineProperty(options, propertyKey, desc);
		});

		return options;
	};
}

export function Prop(options: PropOptions<any> = {}) {
	return function(target, propertyKey) {
		if (typeof options === 'object' && !(options as any).type) {
			(options as any).type = Reflect.getMetadata('design:type', target, propertyKey);
		}
		ensureMetadata(metadataKeys.props, {}, target)[propertyKey] = options;
	};
}

export function Expose() {
	return function(target, propertyKey) {
		ensureMetadata(metadataKeys.expose, [], target).push(propertyKey);
	};
}

export function Emits(...eventNames: string[]) {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	return function(target, propertyKey) {
		const emits = ensureMetadata(metadataKeys.emits, new Set(), target);
		eventNames.forEach(name => emits.add(name));
	};
}

export function Watch(expression: string, options?: WatchOptions) {
	return function(target: Vue, propertyKey: string) {
		ensureMetadata(metadataKeys.watch, {}, target)[expression] = { ...options, handler : target[propertyKey] };
	};
}

export function Ref() {
	return function(target, propertyKey: string) {
		ensureMetadata(metadataKeys.ref, [], target).push(propertyKey);
	};
}

export function Provide(alias?: string) {
	return function(target, propertyKey: string) {
		ensureMetadata(metadataKeys.provide, {}, target)[alias || propertyKey] = propertyKey;
	};
}

export function Inject(alias?: string, defaultValue?: any) {
	return function(target, propertyKey: string) {
		ensureMetadata(metadataKeys.inject, {}, target)[propertyKey] = { from : alias || propertyKey, default : defaultValue };
	};
}

export function Hook(name?: HookName) {
	return function(target, propertyKey: string, desc: PropertyDescriptor) {
		const hooks = ensureMetadata(metadataKeys.hooks, {}, target);
		hooks[name] = hooks[name] || [];
		hooks[name].push(desc.value);
	};
}

// HACK: Since typescript doesn't have a "generic of generics" we explicitly defined 10 mixins and union
export function Mixin<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(t1: Class<T1>, t2?: Class<T2>, t3?: Class<T3>, t4?: Class<T4>, t5?: Class<T5>, t6?: Class<T6>, t7?: Class<T7>, t8?: Class<T8>, t9?: Class<T9>, t10?: Class<T10>): Class<T1 & T2 & T3 & T4 & T5 & T6 & T7 & T8 & T9 & T10> {
	return class {
		static mixins = _.compact([ t1, t2, t3, t4, t5, t6, t7, t8, t9, t10 ]);
	} as any;
}
