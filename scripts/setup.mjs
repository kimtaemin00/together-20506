import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 13)) { console.error('Node.js 22.13 이상을 설치하세요.'); process.exit(1); }
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', env: { ...process.env, npm_config_cache: join(root, '.npm-cache') }, shell: process.platform === 'win32' && command === 'npm' });
  if (result.error || result.status !== 0) { console.error('준비 중 오류가 발생했습니다. 위의 오류를 확인하고 다시 실행하세요.'); process.exit(result.status || 1); }
}
console.log('1/4 서버 라이브러리 설치');
run('npm', ['--prefix', 'server', 'ci', '--no-audit', '--no-fund']);
console.log('2/4 화면 라이브러리 설치');
run('npm', ['--prefix', 'client', 'ci', '--no-audit', '--no-fund']);
console.log('3/4 MySQL 연결 설정 및 테이블 준비');
run(process.execPath, ['server/scripts/configure.mjs', ...process.argv.slice(2)]);
console.log('4/4 화면 빌드');
run('npm', ['run', 'build']);
console.log('\n준비 완료! npm start 실행 후 http://localhost:5000 에 접속하세요. PORT를 변경했다면 해당 포트를 사용하세요.');
