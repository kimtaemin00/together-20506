import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const backend = spawn(process.execPath, ['--watch', 'server/index.js'], { cwd: root, stdio: 'inherit' });
const frontend = spawn('npm', ['--prefix', 'client', 'run', 'dev'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
let stopping = false;
function stop() { if (stopping) return; stopping = true; backend.kill(); frontend.kill(); }
for (const child of [backend, frontend]) { child.on('error', stop); child.on('exit', stop); }
process.on('SIGINT', stop); process.on('SIGTERM', stop);
