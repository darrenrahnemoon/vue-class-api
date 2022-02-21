import { getMetadata, ensureMetadata } from '$/lib/reflect-metadata';
import _                               from '$/lib/lodash';
import {
	SetupContext,
	Prop as PropOptions, Slot,
	reactive, ref, toRefs,
	watch, WatchOptions,
	computed
} from 'vue';

// Dictionary of all the metadata names used. Changing these values will change the name of the metadata used everywhere.
export const metadataKeys = {
	watch  : '__WATCH__',
	props  : '__PROPS__',
	emits  : '__EMITS__',
	expose : '__EXPOSE__',
};

const excludedFields = [ 'props', 'emits', 'attrs', 'slots', 'emit', 'expose' ];
const excludedMethods = [ 'constructor', 'setup' ];

export class Vue {

	readonly props = {};
	readonly emits: string[];


	readonly $attrs: { [x: string]: unknown };
	readonly $slots: Readonly<{ [name: string]: Slot }>;
	readonly $emit: ((event: string, ...args: any[]) => void) | ((event: string, ...args: any[]) => void);

	get name() {
		return this.constructor.name;
	}

	setup(): this
	setup(props): this
	setup(props?, context?: SetupContext): this {
		// First, assign the props so watchers below can pick them up if there's any immediate watchers
		_.assign(this, toRefs(props));
		// _.assign(this, _.pick(context, [ 'attrs', 'slots' ]));
		console.log(context);
		const prototypeProperties = Object.getOwnPropertyDescriptors(this.constructor.prototype);

		const methods = _(prototypeProperties)
			.pickBy((desc, propertyKey) => typeof desc.value === 'function' && !excludedMethods.includes(propertyKey))
			.mapValues((desc, propertyKey) => {
				delete this.constructor.prototype[propertyKey];
				return desc;
			})
			.valueOf();
		Object.defineProperties(this, methods);

		const computedProperties = _(prototypeProperties)
			.pickBy(desc => !!desc.get || !!desc.set)
			.mapValues((desc, propertyKey) => {
				const get = desc.get?.bind(this);
				const set = desc.set?.bind(this);
				delete this.constructor.prototype[propertyKey];
				return computed({ get, set });
			})
			.valueOf();
		_.assign(this, computedProperties);

		const watchers = getMetadata(metadataKeys.watch, this.constructor.prototype) || {};
		_.forEach(watchers, ({ expression, options }, propertyKey) => {
			watch(_.get(this, expression), this[propertyKey].bind(this), options);
		});

		return this;
	}
}

export function Component() {
	return function(target) {
		const instance = new target();
		instance.props = getMetadata(metadataKeys.props, target.prototype) || {};
		instance.emits = Array.from(getMetadata(metadataKeys.emits, target.prototype) || []);
		instance.setup = instance.setup.bind(instance);
		// instance.expose = getMetadata(metadataKeys.expose, target.prototype);

		const instanceProperties = Object.getOwnPropertyDescriptors(instance);

		const refsAndReactiveProperties = _(instanceProperties)
			.pickBy((desc, propertyKey) =>
				typeof desc.value !== 'function' // not a method/hook
				&& typeof desc.get !== 'function' // not a computed field
				&& typeof desc.set !== 'function' // not a computed field
				&& !instance.props[propertyKey] // not a prop
				&& !excludedFields.includes(propertyKey)
			)
			.mapValues(desc => {
				if (typeof desc.value === 'object') {
					return { value : reactive(desc.value) };
				}
				const reference = ref(desc.value);
				return {
					get : () => reference.value,
					set : value => {
						reference.value = value;
					},
				};
			})
			.valueOf();

		Object.defineProperties(instance, refsAndReactiveProperties);

		return instance;
	};
}

export function Prop(options?: PropOptions<any>) {
	options = options || {};
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
		ensureMetadata(metadataKeys.watch, {}, target)[propertyKey] = { expression, options };
	};
}
