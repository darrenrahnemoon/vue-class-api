import _ from 'lodash';

const chained = {
	compactObject : function(obj: any) {
		return _.pickBy(obj, value => !_.isUndefined(value));
	},
	pascalCase : function(string: string) {
		return _.startCase(string).replaceAll(' ', '');
	},
};
_.mixin(_, chained, { chain : true });


const nonChained = {
	mergeClasses(targetClass: Function, ...otherClasses: Function[]) {
		otherClasses.forEach(otherClass => {
			// copy over prototype properties (instance members)
			Object.getOwnPropertyNames(otherClass.prototype).forEach(name => {
				if (!targetClass.prototype.hasOwnProperty(name)) {
					Object.defineProperty(targetClass.prototype, name, Object.getOwnPropertyDescriptor(otherClass.prototype, name));
				}
			});

			// copy over class properties (static members)
			Object.getOwnPropertyNames(otherClass).forEach(name => {
				if (!targetClass.hasOwnProperty(name)) {
					Object.defineProperty(targetClass, name, Object.getOwnPropertyDescriptor(otherClass, name));
				}
			});
		});

		return targetClass;
	},
};
_.mixin(_, nonChained);


export default _;
