<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import { provide, ref } from 'vue';
import HelloWorld       from './components/HelloWorld.vue';

const msg = ref('Hello World!');
const foo = ref('fee');
const blah = ref(null);
provide('lmao', foo);
setTimeout(() => {
	foo.value = 'fy';
	console.log('changed');
}, 4000);
</script>

<template>
	<img alt="Vue logo" src="./assets/logo.png">
	<HelloWorld
		ref="blah"
		:msg="msg"
		height="100%"
		class="bitch"
		@ye="msg = 'Bum'"
	/>
	<button @click="msg = 'Fooo'">
		f
	</button>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
