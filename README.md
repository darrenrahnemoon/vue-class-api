# Vue 3 Class API

While we recognize the decision by the team behind Vue 3 [to drop support for Class Components](https://github.com/vuejs/rfcs/pull/17#issuecomment-494242121) we decided to give it another shot.

## API Documentation

### `@Component`

Similar to `vue-class-components` every component is defined as:

```
<template>
	<div>My Component</div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-class-api';

@Component(options: ComponentOptions)
export default class MyComponent extends Vue {}
</script>
```

`ComponentOptions` is an object with the same pattern used in the Options API (if there's any part of the Options API implementation that hasn't been covered yet in the Class API implementation).

### `@Prop`

```
import { Vue, Component, Prop } from 'vue-class-api';

@Component()
export default class MyComponent extends Vue {
	@Prop({ type : Number, default : 3 })
	readonly foo: number;

	@Prop({ required : true })
	readonly bar: number;

	@Prop()
	readonly lorem: number;
}
```

`Prop` takes one argument that is identical what would normally be supplied to the props object in the Options API.

### `@Ref`
Simplifies accessing template refs by moving them to the instance's scope.

```
<template>
	<div>My Component</div>
	<MyOtherComponent ref="foo"></MyOtherComponent>
</template>

<script lang="ts">
import { Vue, Component }    from 'vue-class-api';
import MyOtherComponent from './foo/MyOtherComponent.vue'

@Component({ 
	components : { MyOtherComponent }
})
export default class MyComponent extends Vue {
	@Ref()
	foo: MyOtherComponent;

	// assuming `MyOtherComponent` has exposed a method called `poke()`
	pokeFoo() {
		this.foo.poke(); // identical to this.$refs.foo.poke();
	}
}
</script>
```

### `@Expose`
Once used, only the decorated fields would be available to the parent component when referenced using the `ref` attribute.

```
import { Vue, Component, Expose } from 'vue-class-api';

@Component()
export default class MyComponent extends Vue {

	@Expose()
	foo() {
		console.log('Called foo');
	}

	// Not accessible if this component is referenced by parent
	hiddenFunction() {
		console.log('Boo!');
	}

}
```

### `@Emits`

Populated the `emits` field in the Options API which helps with better documentation of the component.

```
import { Vue, Component, Emits } from 'vue-class-api';

@Component()
export default class MyComponent extends Vue {

	isCool = false;

	// List out any potential emits from the method
	@Emits('bob', 'marley')
	foo() {
		if (this.isCool) {
			this.$emit('bob');
		}
		else {
			this.$emit('marley');
		}
		this.$emit('bob');
		console.log('Called foo');
	}

	@Emits('jack', 'bob')
	bar() {
		this.$emit('jack');
		this.$emit('bob');
		console.log('Boo!');
	}

}
```
Above will produce:
```
{
	emits : [ 'bob', 'marley', 'jack' ],
}
```

### `@Watch`
Example:
```
import { Vue, Component, Watch } from 'vue-class-api';

@Component()
export default class MyComponent extends Vue {

	spaghetti = {
		delicious : true,
	}

	@Watch('spaghetti', { deep : true, immediate : false })
	foo() {
		console.log('Somebody touched my spaghetti!');
	}

	mounted() {
		this.spaghetti.delicious = false;
	}

}
```

### `@Provide/@Inject`

```
import { Vue, Component, Provide } from 'vue-class-api';

@Component({ components : MyChildComponent })
export default class MyComponent extends Vue {
	@Provide('food')
	food: number = 123;
}
```

```
import { Vue, Component, Inject } from 'vue-class-api';

@Component()
export default class MyChildComponent extends Vue {
	@Inject('food')
	bar: number;

	mounted () {
		console.log(this.bar === 123); // true
	}
}
```

Objects are also supported, however they are being wrapped in a `computed` function provided by Composition API. The reactivity behavior is subject to change depending on how `computed` changes. 

### `@Hook`
Lifecycle hooks are available in two forms:
1) Hook decorator around any method which exposes method in the `methods` object and also gets used as a lifecycle hook
2) Special method names defined on the class

```
import { Vue, Component, Hook } from 'vue-class-api';

@Component()
export default class MyComponent extends Vue {

	@Hook('mounted')
	foo() {
		console.log('This will run second.');
	}

	// Since the name of the method is one of the lifecycle hooks it gets picked up as a life cycle hook 
	mounted() {
		console.log('This will run first.');
	}

	@Hook('beforeMount')
	bar() {
		console.log('This will run before everything else');
	}

	@Hook('mounted')
	foo2() {
		console.log('You can have more than one mounted hook so long as the method is decorated with the same hook name');
		console.log('This will run after foo()'); // While not guaranteed, in most of the cases, the order of decorator execution is top->bottom
	}

}
```

## Roadmap
1) **Extending Components**: We're working on a solution for nested components that provides full typescript support.
2) **More Quality-of-Life Decorators**: We're trying to isolate component options into their own standalone decorators. The end goal is to not have a need to provide any arguments to the @Component decorator.

## Contributions
If you have a proposal for a new decorator to simplify the component definition process or some new cool feature you recently stumbled upon, open up a pull-request. All ideas are welcome! 


## License
                    GNU GENERAL PUBLIC LICENSE
                       Version 3, 29 June 2007

 Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
 Everyone is permitted to copy and distribute verbatim copies
 of this license document, but changing it is not allowed.

