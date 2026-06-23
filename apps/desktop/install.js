import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appPath = path.join(__dirname, 'src-tauri/target/release/bundle/macos/PARITY.app');
const destPath = '/Applications/PARITY.app';

console.log('Checking built application...');
if (!fs.existsSync(appPath)) {
  console.error(`Error: PARITY.app not found at: ${appPath}`);
  console.error('Please run "pnpm desktop:build" first to compile the release version.');
  process.exit(1);
}

console.log(`Copying PARITY.app to ${destPath}...`);
try {
  // Remove existing app if present
  if (fs.existsSync(destPath)) {
    console.log('Removing old version from /Applications...');
    fs.rmSync(destPath, { recursive: true, force: true });
  }
  
  fs.cpSync(appPath, destPath, { recursive: true });
  console.log('Successfully installed PARITY.app to /Applications!');
} catch (error) {
  console.error('Failed to copy application:', error.message);
  process.exit(1);
}
