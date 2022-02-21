import '$/lib/reflect-metadata';

import { createApp } from 'vue';
import App           from './App.vue';
const app = createApp(App);
app.config.unwrapInjectedRef = true;
app.mount('#app');
