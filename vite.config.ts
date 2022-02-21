import { defineConfig } from 'vite';
import vue              from '@vitejs/plugin-vue';
import tsconfigPaths    from 'vite-tsconfig-paths';


export default defineConfig({
	root      : './src',
	publicDir : './src/public',
	plugins   : [
		tsconfigPaths(),
		vue(),
	],
});
