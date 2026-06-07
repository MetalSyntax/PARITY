/**
 * Vercel install script — bypasses pnpm entirely.
 *
 * The web app's vite.config.ts already aliases @parity/core, @parity/i18n and
 * @parity/ui directly to their TypeScript source files, so those packages never
 * need to be present in node_modules. We strip them out here so plain npm can
 * install the remaining dependencies without needing pnpm workspace resolution.
 *
 * All external packages those workspace libs depend on (date-fns, zod,
 * framer-motion, lucide-react, react) are already listed in apps/web/package.json,
 * so nothing is missing after the strip.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const webDir = path.join(__dirname, 'apps', 'web');
const pkgPath = path.join(webDir, 'package.json');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

['@parity/core', '@parity/i18n', '@parity/ui'].forEach((dep) => {
  delete pkg.dependencies[dep];
});

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

execSync('npm install --include=dev --legacy-peer-deps --no-package-lock', {
  cwd: webDir,
  stdio: 'inherit',
});
