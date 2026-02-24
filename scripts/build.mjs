import * as esbuild from 'esbuild';
import { rimraf } from 'rimraf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isProduction = process.argv.includes('--production');

// PostCSS 插件用於處理 CSS
const postcssPlugin = {
  name: 'postcss',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const css = await fs.promises.readFile(args.path, 'utf8');
      const result = await postcss([tailwindcss, autoprefixer]).process(css, {
        from: args.path,
      });
      return {
        contents: result.css,
        loader: 'css',
      };
    });
  },
};

// 清理輸出目錄
await rimraf('dist');

// 確保dist目錄存在
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

// 複製並修改 index.html
const htmlContent = fs.readFileSync('index.html', 'utf8');
const basePath = isProduction ? '/lottery' : '';
const modifiedHtml = htmlContent
  .replace(
    '<script type="module" src="/src/main.tsx"></script>',
    `<link rel="stylesheet" href="${basePath}/main.css">\n    <script type="module" src="${basePath}/main.js"></script>`
  )
  .replace(/href="\/vite\.svg"/g, `href="${basePath}/vite.svg"`);
fs.writeFileSync('dist/index.html', modifiedHtml);
fs.writeFileSync('dist/.nojekyll', ''); // Prevent GitHub Pages from ignoring files with underscores

// 建置配置
const buildOptions = {
  entryPoints: ['src/main.tsx'],
  bundle: true,
  outdir: 'dist',
  format: 'esm',
  splitting: true,
  sourcemap: !isProduction,
  minify: isProduction,
  target: ['es2020'],
  jsx: 'automatic',
  jsxImportSource: 'react',
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
    '.jsx': 'jsx',
    '.js': 'js',
  },
  plugins: [postcssPlugin],
  define: {
    'process.env.NODE_ENV': isProduction ? '"production"' : '"development"',
  },
  alias: {
    '@': path.resolve(process.cwd(), 'src'),
  },
};

if (isProduction) {
  // 生產建置
  await esbuild.build(buildOptions);
  console.log('✅ 生產建置完成');
} else {
  // 開發模式 - 使用 watch 和 serve
  const ctx = await esbuild.context(buildOptions);

  await ctx.watch();
  console.log('👀 監聽檔案變更中...');

  const { host, port } = await ctx.serve({
    servedir: 'dist',
    host: 'localhost',
    port: 3000,
  });

  console.log(`🚀 開發伺服器啟動於 http://localhost:${port}`);
}
