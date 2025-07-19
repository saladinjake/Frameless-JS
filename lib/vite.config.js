import { resolve } from 'path'

import { defineConfig } from 'vite';
import eslint from 'vite-plugin-eslint';

import fsp from "fs/promises"
import path from 'path';
const htmlFileRegex = /\.html$/
const postFixRe = /[?#].*$/s;
const postFix = "?.html-import";

function cleanUrl(url) {
  return url.replace(postFixRe, '')
}

const htmlImportBuild = () => ({
  name: "html-import:build",
  enforce: "pre",
  apply: "build",
  async resolve(id, importer, options) {
    if (htmlFileRegex.test(id) && !options) {
      let res = await this.resolve(id, importer, {
        skipSelf: true,
        ...options
      })

      if (!res || res.external) return res
      return res.id + postFix
    }


  },

  async load(id) {
    if (!id.endsWith(postFix)) return;
    let htmlContent = await fsp.readFile(cleanUrl(id))

    // do stuff with html file content buffer

    return `export default ${JSON.stringify(htmlContent.toString('utf-8'))}`
  }
})

function htmlImportServe() {
  return {
    name: "html-import:serve",
    apply: "serve",
    transform(src, id) {
      if (htmlFileRegex.test(id)) {
        return {
          code: `export default ${JSON.stringify(src)}`
        }
      }
    }
  }
}

export default defineConfig({
  publicDir: 'public',
  root: './',

  build: {
    outDir: 'dist',
    lib: {
      entry: [
        resolve(__dirname, 'src/index.js'),
        resolve(__dirname, 'src/bootstrap.js')
      ],
      name: 'frameless-js',
      fileName: (format, name) => {
        if (format === 'es') {
          return `${name}.js`
        }

        return `${name}.${format}`
      }
    },

    rollupOptions: {
      // external: ['collect.js'],
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const modulePath = id.split('node_modules/')[1];
            const topLevelFolder = modulePath?.split('/')[0];
            if (!topLevelFolder) {
              const scopedPackageName = modulePath?.split('/')[1];
              return scopedPackageName?.split('@')[
                scopedPackageName.startsWith('@') ? 1 : 0
              ];
            }
            return topLevelFolder;
          }
          return null;
        },
      },
    },
    minify: 'esbuild',
  },
  plugins: [
    eslint({
      cache: false,
      fix: true,
    }),
    htmlImportBuild(),
    htmlImportServe()
  ],
});

