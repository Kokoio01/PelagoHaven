import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const rustInfo = execSync('rustc -vV').toString();
const targetTriple = /host: (\S+)/g.exec(rustInfo)[1];

const ext = process.platform === 'win32' ? '.exe' : '';
const src = path.join('dist', `ap-helper${ext}`);
const destDir = path.join('src-tauri', 'binaries');
const dest = path.join(destDir, `ap-helper-${targetTriple}${ext}`);

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

fs.copyFileSync(src, dest);
console.log(`Copied sidecar to: ${dest}`);