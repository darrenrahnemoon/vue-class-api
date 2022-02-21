<script lang="ts">
import { Vue, Component, Prop, Watch, Emits, Expose } from '$/lib/vue';

@Component()
export default class HelloWorld extends Vue {
	@Prop({ type : String })
	msg: string;

	@Expose()
	count: number = 0;

	@Watch('msg')
	onMsgChange(msg) {
		console.log(this);
		console.log('msgChangedTo', msg);
	}

	get bob() {
		return this.count;
	}

	set bob(value) {
		this.count = value;
	}

	@Emits('ye')
	wooooooo() {
		console.log(this.bob);
		this.emit('ye');
	}
}

</script>

<template>
	<h1>{{ msg }}</h1>

	<p>
		Recommended IDE setup:
		<a href="https://code.visualstudio.com/" target="_blank">VSCode</a>
		+
		<a href="https://github.com/johnsoncodehk/volar" target="_blank">Volar</a>
	</p>

	<p>See <code>README.md</code> for more information.</p>
	<button @click="$emit('ye')">
		Emit to parent {{ count }}
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
