import { defineConfig, Plugin } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { glob } from 'glob';
import { extname, relative } from 'path';
import { fileURLToPath } from 'url';
import fsp from 'fs/promises';

const htmlFileRegex = /\.html$/;
const postFix = '?.html-import';
const postFixRe = /[?#][\s\S]*$/;
const cleanUrl = (url: string) => url.replace(postFixRe, '');

const htmlImportBuild = (): any => ({
  name: 'html-import:build',
  enforce: 'pre',
  apply: 'build',
  async resolve(id: any, importer: any, options: any) {
    if (htmlFileRegex.test(id) && !options) {
      const res: any = await this.resolve(id, importer, {
        skipSelf: true,
        ...(options || {}),
      });
      if (!res || res.external) return res;
      return res.id + postFix;
    }
  },
  async load(id: any) {
    if (!id.endsWith(postFix)) return;
    const htmlContent = await fsp.readFile(cleanUrl(id));
    return `export default ${JSON.stringify(htmlContent.toString('utf-8'))}`;
  },
});

const htmlImportServe = () : Plugin => ({
  name: 'html-import:serve',
  apply: 'serve',
  transform(src: any, id: any) {
    if (htmlFileRegex.test(id)) {
      return {
        code: `export default ${JSON.stringify(src)}`,
      };
    }
  },
});

const inputEntries = Object.fromEntries(
  glob.sync('lib/**/*.{ts,tsx}', {
    ignore: ['lib/**/*.d.ts'],
  }).map((file) => [
    relative('lib', file.slice(0, file.length - extname(file).length)),
    fileURLToPath(new URL(file, import.meta.url)),
  ])
);

export default defineConfig({
  plugins: [
    dts({
      tsconfigPath: resolve(__dirname, 'tsconfig.lib.json'),
      outDir: 'dist/types',
    }),
    htmlImportBuild(),
    htmlImportServe(),
  ],
  build: {
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, 'lib/main.ts'),
      formats: ['es', 'cjs'],
    },
    outDir: 'dist',
    rollupOptions: {
      external: ['react', 'react/jsx-runtime'],
      input: inputEntries,
      output: [
        {
          format: 'es',
          dir: 'dist/esm',
          assetFileNames: 'assets/[name][extname]',
          entryFileNames: '[name].js',
        },
        {
          format: 'cjs',
          dir: 'dist/cjs',
          assetFileNames: 'assets/[name][extname]',
          entryFileNames: '[name].js',
        },
      ],
    },
  },
});
