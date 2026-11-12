import { createInterface, emitKeypressEvents } from 'node:readline';
import { stdin, stdout } from 'node:process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import dotenv from 'dotenv';
import { initialize } from './database.mjs';
const envPath = fileURLToPath(new URL('../.env', import.meta.url));
let existing = {};
try { existing = dotenv.parse(await readFile(envPath, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const ask = (label, fallback = '') => new Promise(resolve => {
  const rl = createInterface({ input: stdin, output: stdout });
  rl.question(label + (fallback ? ' [' + fallback + ']' : '') + ': ', answer => { rl.close(); resolve(answer.trim() || fallback); });
});
async function secret() {
  if (!stdin.isTTY) return ask('DB 비밀번호');
  stdout.write('DB 비밀번호 (입력한 글자는 보이지 않습니다): ');
  emitKeypressEvents(stdin); stdin.setRawMode(true); stdin.resume();
  return new Promise(resolve => {
    let value = '';
    const listener = (text, key) => {
      if (key?.ctrl && key.name === 'c') { stdin.setRawMode(false); process.exit(130); }
      if (key?.name === 'return') {
        stdin.off('keypress', listener); stdin.setRawMode(false); stdin.pause(); stdout.write('\n'); resolve(value); return;
      }
      if (key?.name === 'backspace') { value = [...value].slice(0, -1).join(''); return; }
      if (!key?.ctrl && !key?.meta && text && !/[\r\n]/.test(text)) value += text;
    };
    stdin.on('keypress', listener);
  });
}
try {
  let values;
  if (process.argv.includes('--non-interactive')) {
    values = { ...existing };
    for (const key of ['DB_HOST','DB_PORT','DB_USER','DB_PASSWORD','DB_NAME','PORT','HOST','JWT_SECRET']) if (process.env[key] !== undefined) values[key] = process.env[key];
    if (!values.DB_USER || values.DB_PASSWORD === undefined) throw new Error('자동 설정에는 DB_USER, DB_PASSWORD가 필요합니다.');
  } else {
    const useExisting = existing.DB_USER && existing.JWT_SECRET && (await ask('기존 .env 설정을 그대로 사용할까요? y/n', 'y')).toLowerCase() === 'y';
    if (useExisting) values = existing;
    else {
      console.log('Workbench에서 성공한 연결의 주소, 포트, 계정과 같은 값을 입력하세요.');
      values = {
        DB_HOST: await ask('DB 주소', existing.DB_HOST || '127.0.0.1'),
        DB_PORT: await ask('DB 포트', existing.DB_PORT || '3306'),
        DB_USER: await ask('MySQL 계정명 (학번이 아닐 수도 있음)', existing.DB_USER || 'root'),
        DB_PASSWORD: await secret(),
        DB_NAME: await ask('DB 이름', existing.DB_NAME || 'together_20506'),
        PORT: await ask('웹사이트 포트', existing.PORT || '5000'),
      };
    }
  }
  values = { DB_HOST: '127.0.0.1', DB_PORT: '3306', DB_NAME: 'together_20506', PORT: '5000', ...values,
    HOST: '127.0.0.1', JWT_SECRET: values.JWT_SECRET?.length >= 32 ? values.JWT_SECRET : randomBytes(32).toString('hex') };
  for (const port of [values.PORT, values.DB_PORT]) if (!/^\d+$/.test(String(port)) || Number(port) < 1 || Number(port) > 65535) throw new Error('포트는 1~65535의 정수여야 합니다.');
  await initialize(values);
  // dotenv가 원문을 그대로 읽을 수 있는 따옴표를 고릅니다. 비밀번호를 로그에 출력하지 않습니다.
  const quote = value => {
    value = String(value);
    if (/[\r\n]/.test(value)) throw new Error('환경설정 값에 줄바꿈을 넣을 수 없습니다.');
    for (const mark of ["'", '"', '\x60']) if (!value.includes(mark) && (mark !== '"' || !/\\[nr]/.test(value))) return mark + value + mark;
    throw new Error('환경설정 값에 모든 종류의 따옴표를 함께 넣을 수 없습니다. .env를 직접 설정하세요.');
  };
  const keys = ['HOST','PORT','DB_HOST','DB_PORT','DB_USER','DB_PASSWORD','DB_NAME','JWT_SECRET'];
  const content = '# 이 파일에는 개인 비밀번호가 있습니다. GitHub에 올리지 마세요.\n' + keys.map(k => k + '=' + quote(values[k])).join('\n') + '\n';
  await mkdir(new URL('../', import.meta.url), { recursive: true });
  await writeFile(envPath, content, { mode: 0o600 });
  console.log('DB 연결·테이블 확인 완료. server/.env를 저장했습니다 (비밀번호는 출력하지 않음).');
} catch (error) { console.error('설정 실패: ' + (error.safeMessage || error.message)); process.exitCode = 1; }
