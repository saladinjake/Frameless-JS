import { defineConfig } from 'vite'
import type { Plugin } from 'vite';
import { extname, relative, resolve } from 'path'
import { fileURLToPath } from 'node:url'
import { glob } from 'glob'

import dts from 'vite-plugin-dts'


import fsp from "fs/promises"
import path from 'path';
const htmlFileRegex = /\.html$/
const postFixRe = /[?#][\s\S]*$/;

const postFix = "?.html-import";

function cleanUrl(url: string) {
  return url.replace(postFixRe, '')
}


export const htmlImportBuild = (): any => ({
  name: "html-import:build",
  enforce: "pre", 
  apply: "build", 
  async resolve(id: any, importer: any, options: any) {
    if (htmlFileRegex.test(id) && !options) {
      let res = await this.resolve(id, importer, {
        skipSelf: true,
        ...(options || {})
      });

      if (!res || res.external) return res;
      return res.id + postFix;
    }
  },

  async load(id: any) {
    if (!id.endsWith(postFix)) return;
    let htmlContent = await fsp.readFile(cleanUrl(id));
    return `export default ${JSON.stringify(htmlContent.toString('utf-8'))}`;
  }
});
export const htmlImportServe = (): Plugin => ({
  name: "html-import:serve",
  apply: "serve", // string literal
  transform(src, id) {
    if (htmlFileRegex.test(id)) {
      return {
        code: `export default ${JSON.stringify(src)}`
      };
    }
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
   
  
    dts({
      tsconfigPath: resolve(__dirname, "tsconfig.lib.json"),
    }),
     htmlImportBuild(),
    htmlImportServe()
  ],
  build: {
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, 'lib/main.ts'),
      formats: ['es']
    },
    rollupOptions: {
      external: ['react', 'react/jsx-runtime'],
      input: Object.fromEntries(
        // https://rollupjs.org/configuration-options/#input
        glob.sync('lib/**/*.{ts,tsx}', {
          ignore: ["lib/**/*.d.ts"],
        }).map(file => [
          // 1. The name of the entry point
          // lib/nested/foo.js becomes nested/foo
          relative(
            'lib',
            file.slice(0, file.length - extname(file).length)
          ),
          // 2. The absolute path to the entry file
          // lib/nested/foo.ts becomes /project/lib/nested/foo.ts
          fileURLToPath(new URL(file, import.meta.url))
        ])
      ),
      output: {
        assetFileNames: 'assets/[name][extname]',
        entryFileNames: '[name].js',
      }
    }
  }
})