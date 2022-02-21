/// <reference types="lodash"/>
declare namespace _ {
	interface LoDashStatic {

		/**
		* Removes all properties with an undefined value
		*/
		compactObject<T extends object>(object: T | null | undefined): Partial<T>;

		/**
		* Merge multiple classes into one class (static and non-static members)
		* @param targetClass  the base class
		* @param otherClasses the classes to merge into the base class in order
		*/
		mergeClasses<T extends Function>(targetClass: T, ...otherClasses: Function[]): T;

		/**
		* Converts the passed string to PascalCase
		*/
		pascalCase(string?: string): string;
	}
}

declare module 'vue/types/vue' {
	interface Vue {
	  _: LoDashStatic;
	}
}
