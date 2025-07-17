import { readFileSync } from 'fs';
import { resolve } from 'path';
import { terser } from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

const banner = `/*!
 * ${pkg.name} v${pkg.version}
 * ${pkg.description}
 * 
 * @author ${pkg.author}
 * @license ${pkg.license}
 * @repository ${pkg.repository.url}
 */`;

export default [
  // ES Module build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/stick-to-bottom.esm.js',
      format: 'es',
      banner
    },
    plugins: [
      copy({
        targets: [
          { src: 'src/index.d.ts', dest: 'dist', rename: 'stick-to-bottom.d.ts' }
        ]
      })
    ]
  },
  
  // CommonJS build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/stick-to-bottom.js',
      format: 'cjs',
      banner,
      exports: 'default'
    }
  },
  
  // UMD build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/stick-to-bottom.umd.js',
      format: 'umd',
      name: 'StickToBottom',
      banner
    }
  },
  
  // UMD minified build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/stick-to-bottom.umd.min.js',
      format: 'umd',
      name: 'StickToBottom',
      banner
    },
    plugins: [
      terser({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          warnings: false
        }
      })
    ]
  }
];