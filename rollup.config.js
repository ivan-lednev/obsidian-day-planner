import typescript from '@rollup/plugin-typescript';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import svelte from "rollup-plugin-svelte";
import autoPreprocess from 'svelte-preprocess';

const TEST_VAULT = 'test-vault/.obsidian/plugins/obsidian-day-planner';

export default {
  input: 'src/main.ts',
  output: {
    dir: 'dist/',
    sourcemap: 'inline',
    format: 'cjs',
    exports: 'default'
  },
  external: ['obsidian'],
  plugins: [
    typescript(),
    nodeResolve({browser: true}),
    commonjs(),
    svelte({
       preprocess: autoPreprocess()
    }),
    copy({
      targets: [
        { src: 'dist/main.js', dest: TEST_VAULT },
        { src: ['manifest.json', 'styles.css'], dest: TEST_VAULT }
      ], flatten: true
    })
  ]
};