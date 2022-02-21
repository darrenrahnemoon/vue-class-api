<template>
	<div>{{ bam }} {{ yet }} </div>
	<button @click="poop">
		Push
	</button>
</template>

<script lang="ts">
import { Vue, Component, Inject, Expose } from '$/lib/vue';

@Component()
export default class Component2 extends Vue {
	@Inject('fam')
	yet: number[];

	get bam() {
		return this.yet?.[0];
	}

	@Expose()
	poop() {
		console.log(this);
		this.yet.push(53);
	}
}
</script>
