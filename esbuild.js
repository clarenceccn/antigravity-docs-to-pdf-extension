const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isWatch = process.argv.includes('--watch');

// Copy static assets to dist/
function copyAssets() {
    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
    }

    const assets = ['styles.css', 'template.html'];
    for (const asset of assets) {
        const src = path.join(__dirname, 'src', asset);
        const dest = path.join(distDir, asset);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
            console.log(`  Copied ${asset} -> dist/${asset}`);
        }
    }
}

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
    entryPoints: ['src/extension.ts'],
    bundle: true,
    outfile: 'dist/extension.js',
    external: ['vscode'],
    format: 'cjs',
    platform: 'node',
    target: 'node18',
    sourcemap: true,
    minify: false,
    plugins: [
        {
            name: 'copy-assets',
            setup(build) {
                build.onEnd(() => {
                    copyAssets();
                });
            },
        },
    ],
};

async function main() {
    if (isWatch) {
        const ctx = await esbuild.context(buildOptions);
        await ctx.watch();
        console.log('👀 Watching for changes...');
    } else {
        await esbuild.build(buildOptions);
        console.log('✅ Build complete');
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
