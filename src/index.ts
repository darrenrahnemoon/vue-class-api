import { getMetadata, ensureMetadata }                                 from './reflect-metadata';
import _                                                               from 'lodash';
import {
	ComponentPublicInstance, ComponentInternalInstance, ComponentOptions,
	Prop as PropOptions, Slots, WatchOptions, WatchStopHandle, computed
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

const excludedProperties = [ 'provide', 'inject', 'name', 'props', 'emits', 'expose', 'watch', 'computed', '$:', '$data', '$props', '$attrs', '$refs', '$slots', '$root', '$parent', '$emit', '$el', '$options' ];
const hookNames = [ 'beforeCreate', 'created', 'beforeMount', 'mounted', 'beforeUpdate', 'updated', 'activated', 'deactivated', 'beforeDestroy', 'beforeUnmount', 'destroyed', 'unmounted', 'renderTracked', 'renderTriggered', 'errorCaptured' ];
type HookName = 'beforeCreate' | 'created' | 'beforeMount' | 'mounted' | 'beforeUpdate' | 'updated' | 'activated' | 'deactivated' | 'beforeDestroy' | 'beforeUnmount' | 'destroyed' | 'unmounted' | 'renderTracked' | 'renderTriggered' | 'errorCaptured';

export class Vue implements ComponentPublicInstance {
	// #region Component options
	provide: Function | Dictionary<any>;
	inject: Dictionary<any | { from?: string; default?: any }>;
	name: string;
	props: Dictionary<PropOptions<any>>;
	emits: string[];
	expose: string[];
	watch: Dictionary<{ handler: Function } & WatchOptions>
	computed: Dictionary<Function | { get?: Function; set?: Function }>
	// #endregion Component options

	// #region Public instance fields
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
	// #endregion Public instance fields
}

export function Component(options: ComponentOptions = {}) {
	return function(VueSubclass) {
		const instance = new VueSubclass();
		const instanceProperties = Object.getOwnPropertyDescriptors(instance);
		const prototypeProperties = Object.getOwnPropertyDescriptors(VueSubclass.prototype);

		// Provide/Inject
		const provide = getMetadata(metadataKeys.provide, VueSubclass.prototype);
		instance.provide = function() {
			return _.mapValues(provide, key => computed(() => instance[key]));
		};
		instance.inject = getMetadata(metadataKeys.inject, VueSubclass.prototype) || [];

		// Props
		instance.props = getMetadata(metadataKeys.props, VueSubclass.prototype) || {};

		// Computed
		instance.computed = _.pickBy(prototypeProperties, desc => desc.get || desc.set);

		// Template Refs
		const refs = getMetadata(metadataKeys.ref, VueSubclass.prototype) || [];
		refs.forEach(ref => {
			instance.computed[ref] = {
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
				&& !excludedProperties.includes(propertyKey) 	// Not component option
				&& !instance.props[propertyKey] 				// Not a prop
				&& !refs.includes(propertyKey) 					// Not a ref
				&& !instance.inject[propertyKey]) 				// Not an injected value
			.keys()
			.valueOf();
		const data = _.pick(instance, dataProperties);
		instance.data = function() {
			return data;
		};

		// Component Name
		instance.name = options.name || VueSubclass.name;

		// Emits
		instance.emits = Array.from(getMetadata(metadataKeys.emits, VueSubclass.prototype) || []);

		// Expose
		instance.expose = getMetadata(metadataKeys.expose, VueSubclass.prototype);

		// Watchers
		instance.watch = getMetadata(metadataKeys.watch, VueSubclass.prototype) || {};

		// Methods
		instance.methods = _(prototypeProperties)
			.pickBy((desc, propertyKey) => typeof desc.value === 'function' && !hookNames.includes(propertyKey))
			.mapValues(desc => desc.value).valueOf();

		const hooks = getMetadata(metadataKeys.hooks, VueSubclass.prototype) || {};
		hookNames.forEach(hookName => {
			const methods = hooks[hookName] || [];
			const prototypeHook = VueSubclass.prototype[hookName];
			if (prototypeHook) {
				methods.unshift(prototypeHook);
			}
			instance[hookName] = methods;
		});

		// Overwrite everything with any specified component option passed to the @Component decorator
		_.assign(instance, options);
		return instance;
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
export function Mixin<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(t1: T1, t2?: T2, t3?: T3, t4?: T4, t5?: T5, t6?: T6, t7?: T7, t8?: T8, t9?: T9, t10?: T10): T1 & T2 & T3 & T4 & T5 & T6 & T7 & T8 & T9 & T10 {
	return class {
		mixins = _.compact([ t1, t2, t3, t4, t5, t6, t7, t8, t9, t10 ]);
	} as any;
}
