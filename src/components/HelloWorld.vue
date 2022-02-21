<script lang="ts">
import { Vue, Component, Prop, Watch, Emits, Expose, Ref, Inject, Provide } from '$/lib/vue';
import Component2                                                           from './Component2.vue';

@Component({
	components : { Component2 },
})
export default class HelloWorld extends Vue {
	@Prop({ type : String })
	msg: string;

	@Provide('fam')
	flow: number[] = [ 1, 2, 3 ];

	@Expose()
	count: number = 0;

	@Inject()
	lmao: number;

	@Ref()
	cool;

	@Watch('msg')
	onMsgChange(msg) {
		// console.log('msgChangedTo', msg);
		console.log(this.cool);
	}

	get bob() {
		return this.count;
	}

	set bob(value) {
		this.count = value;
	}

	@Emits('ye')
	bump() {
		this.flow = [ 100000 ];
		console.log(this, this.cool);
		this.lmao = 1233;
		this.$emit('ye');
	}
}

</script>

<template>
	<h1 v-bind="$attrs">
		{{ msg }} {{ lmao }}
	</h1>
	{{ flow }}
	<Component2 ref="cool" />

	<p>
		Recommended IDE setup:
		<a href="https://code.visualstudio.com/" target="_blank">VSCode</a>
		+
		<a href="https://github.com/johnsoncodehk/volar" target="_blank">Volar</a>
	</p>

	<p>See <code>README.md</code> for more information.</p>
	<button @click="$emit('ye'); bump()">
		Emit to parent {{ count }} {{ bob }}
	</button>
	<p>
		<a href="https://vitejs.dev/guide/features.html" target="_blank">
			Vite Docs
		</a>
		|
		<a href="https://v3.vuejs.org/" target="_blank">Vue 3 Docs</a>
	</p>

	<button type="button" @click="count++">
		counter is: {{ count }}
	</button>
	<p>
		Edit
		<code>components/HelloWorld.vue</code> to test hot module replacement.
	</p>
</template>

<style scoped>
a {
  color: #42b983;
}

label {
  margin: 0 0.5em;
  font-weight: bold;
}

code {
  background-color: #eee;
  padding: 2px 4px;
  border-radius: 4px;
  color: #304455;
}
</style>
