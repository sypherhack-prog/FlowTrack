// agent-desktop/build.js
// Simple esbuild bundler for the React + TS renderer.

const esbuild = require('esbuild');

esbuild
  .build({
    entryPoints: ['src/renderer.tsx'],
    bundle: true,
    outfile: 'renderer.js',
    platform: 'browser',
    sourcemap: true,
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
