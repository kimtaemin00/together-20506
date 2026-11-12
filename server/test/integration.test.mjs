import test from 'node:test';
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { initialize } from '../scripts/database.mjs';
import { setTimeout as delay } from 'node:timers/promises';

test('MySQL 회원/스터디 CRUD, bcrypt, JOIN, 작성자 권한과 탈퇴', { timeout: 45000 }, async (t) => {
  const name = process.env.TEST_DB_NAME;
  assert.match(name || '', /_test$/, 'TEST_DB_NAME은 반드시 _test로 끝나는 별도 시험 DB여야 합니다.');
  const env = { ...process.env, DB_HOST: process.env.TEST_DB_HOST || '127.0.0.1', DB_PORT: process.env.TEST_DB_PORT || '3306',
    DB_USER: process.env.TEST_DB_USER || 'root', DB_PASSWORD: process.env.TEST_DB_PASSWORD || '', DB_NAME: name,
    JWT_SECRET: randomBytes(32).toString('hex'), PORT: process.env.TEST_PORT || '5057', HOST: '127.0.0.1' };
  await initialize(env);
  const db = await mysql.createConnection({ host: env.DB_HOST, port: Number(env.DB_PORT), user: env.DB_USER, password: env.DB_PASSWORD, database: name });
  const prefix = 'test' + Date.now();
  const server = spawn(process.execPath, [fileURLToPath(new URL('../index.js', import.meta.url))], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  server.stdout.on('data', chunk => { log += chunk; }); server.stderr.on('data', chunk => { log += chunk; });
  const base = 'http://127.0.0.1:' + env.PORT;
  async function request(path, method = 'GET', body, token) {
    const response = await fetch(base + '/api' + path, { method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: await response.json() };
  }
  t.after(async () => {
    if (server.exitCode === null) {
      server.kill('SIGTERM');
      await Promise.race([new Promise(resolve => server.once('exit', resolve)), delay(3000)]);
      if (server.exitCode === null) server.kill('SIGKILL');
    }
    await db.execute('DELETE FROM users WHERE email IN (?,?)', [prefix + 'a@example.test', prefix + 'b@example.test']);
    await db.end();
  });
  let ready = false;
  for (let i = 0; i < 80; i++) {
    if (server.exitCode !== null) break;
    try { if ((await request('/health')).status === 200) { ready = true; break; } } catch {}
    await delay(100);
  }
  assert.ok(ready, '서버 시작 실패: ' + log);
  const pass = 'TestPassword-20506';
  let a, b, aid, bid, studyId;
  const sample = { title: '수학 함께 공부해요', description: 'DB에 실제로 저장되는 연동 테스트입니다.', subject: '수학', meeting_place: '도서관', schedule: '매주 목요일 점심시간', target_grade: '2학년', capacity: 4, status: 'OPEN' };
  await t.test('사이트와 새로고침 경로, health 확인', async () => {
    const response = await fetch(base + '/mypage/edit');
    assert.equal(response.status, 200); assert.match(await response.text(), /<div id="root">/);
    assert.equal((await request('/health')).body.database, 'connected');
    assert.equal((await request('/missing')).status, 404);
  });
  await t.test('A/B 가입과 bcrypt 저장, 중복 거부', async () => {
    for (const [key, student, suffix] of [['a','90101','1'],['b','90102','2']]) {
      const body = { email: prefix + key + '@example.test', password: pass, nickname: key.toUpperCase(), phone_number: prefix.slice(4) + suffix, entry_year: 2026, student_id: student };
      const result = await request('/users/signup', 'POST', body);
      assert.equal(result.status, 201); if (key === 'a') a = result.body.token; else b = result.body.token;
      assert.equal((await request('/users/signup', 'POST', body)).status, 409);
      const [[user]] = await db.execute('SELECT id,password FROM users WHERE email=?', [body.email]);
      assert.notEqual(user.password, pass); assert.match(user.password, /^\$2[aby]\$/); assert.ok(await bcrypt.compare(pass, user.password));
      if (key === 'a') aid = user.id; else bid = user.id;
    }
  });
  await t.test('로그인 성공/실패와 프로필 해시 비공개', async () => {
    assert.equal((await request('/users/login', 'POST', { email: prefix + 'a@example.test', password: 'incorrect' })).status, 401);
    const login = await request('/users/login', 'POST', { email: prefix + 'a@example.test', password: pass });
    assert.equal(login.status, 200); a = login.body.token;
    assert.equal((await request('/users/me')).status, 401);
    const me = await request('/users/me', 'GET', undefined, a);
    assert.equal(me.status, 200); assert.equal(me.body.id, aid); assert.ok(!('password' in me.body));
    assert.equal((await request('/users/me', 'GET', undefined, 'broken')).status, 401);
  });
  await t.test('프로필 수정: 비밀번호 확인, 입학년도 보존', async () => {
    const change = { currentPassword: 'wrong', nickname: '수정된 A', phone_number: prefix.slice(4) + '1', student_id: '90111', entry_year: 2099 };
    assert.equal((await request('/users/me', 'PUT', change, a)).status, 400);
    change.currentPassword = pass;
    assert.equal((await request('/users/me', 'PUT', change, a)).status, 200);
    const me = (await request('/users/me', 'GET', undefined, a)).body;
    assert.equal(me.nickname, change.nickname); assert.equal(me.entry_year, 2026); assert.equal(me.student_id, '90111');
  });
  await t.test('스터디 등록 인증 및 서버 입력 검증', async () => {
    assert.equal((await request('/studies', 'POST', { ...sample, owner_id: aid })).status, 401);
    assert.equal((await request('/studies', 'POST', { ...sample, capacity: 1 }, a)).status, 400);
    assert.equal((await request('/studies', 'POST', { ...sample, description: '' }, a)).status, 400);
    const result = await request('/studies', 'POST', { ...sample, user_id: bid, owner_id: bid }, a);
    assert.equal(result.status, 201); studyId = result.body.studyId;
    const [[p]] = await db.execute('SELECT * FROM study_posts WHERE id=?', [studyId]);
    assert.equal(p.owner_id, aid);
    for (const invalid of [{ capacity: 21 }, { capacity: 2.5 }, { subject: '없는 과목' }, { status: 'BROKEN' }, { schedule: '' }, { target_grade: '4학년' }]) {
      assert.equal((await request('/studies', 'POST', { ...sample, ...invalid }, a)).status, 400);
    }
  });
  await t.test('전체 조회 및 JOIN은 실제 DB 회원 닉네임을 반환', async () => {
    const list = await request('/studies');
    assert.equal(list.status, 200);
    const p = list.body.find(row => row.id === studyId);
    assert.equal(p.author_nickname, '수정된 A'); assert.ok(!('password' in p)); assert.ok(!('phone_number' in p)); assert.ok(!('email' in p));
    assert.ok((await request('/studies?subject=수학')).body.some(p => p.id === studyId));
    assert.ok(!(await request('/studies?subject=영어')).body.some(p => p.id === studyId));
  });
  await t.test('두 번째 JOIN: 상태별 집계, 0건 회원, 같은 닉네임도 별도 집계', async () => {
    // 닉네임만으로 GROUP BY 하면 서로 다른 회원이 합쳐지는 오류를 검증합니다.
    assert.equal((await request('/users/me', 'PUT', {
      nickname: '수정된 A', phone_number: prefix.slice(4) + '2', student_id: '90102', currentPassword: pass,
    }, b)).status, 200);
    const extra = await request('/studies', 'POST', { ...sample, status: 'CLOSED' }, a);
    assert.equal(extra.status, 201);
    const summary = await request('/studies/member-summary');
    assert.equal(summary.status, 200);
    const memberA = summary.body.find(row => row.member_id === aid);
    const memberB = summary.body.find(row => row.member_id === bid);
    assert.deepEqual(memberA, { member_id: aid, nickname: '수정된 A', total_count: 2, open_count: 1, closed_count: 1 });
    assert.deepEqual(memberB, { member_id: bid, nickname: '수정된 A', total_count: 0, open_count: 0, closed_count: 0 });
    assert.equal((await request('/studies/' + extra.body.studyId, 'DELETE', undefined, a)).status, 200);
  });
  await t.test('B의 A 스터디 수정/삭제를 거부하고 원본 유지', async () => {
    assert.equal((await request('/studies/' + studyId, 'PUT', { ...sample, title: '침입 수정' }, b)).status, 403);
    assert.equal((await request('/studies/' + studyId, 'DELETE', undefined, b)).status, 403);
    assert.equal((await request('/studies/' + studyId)).body.title, sample.title);
  });
  await t.test('본인 수정과 모집 마감, 변경 없는 저장도 성공', async () => {
    const change = { ...sample, title: '수학 마감 안내', capacity: 6, status: 'CLOSED', owner_id: bid };
    assert.equal((await request('/studies/' + studyId, 'PUT', change, a)).status, 200);
    assert.equal((await request('/studies/' + studyId, 'PUT', change, a)).status, 200);
    const p = (await request('/studies/' + studyId)).body;
    assert.equal(p.title, change.title); assert.equal(p.capacity, 6); assert.equal(p.owner_id, aid); assert.equal(p.status, 'CLOSED');
    const member = (await request('/studies/member-summary')).body.find(row => row.member_id === aid);
    assert.equal(member.total_count, 1); assert.equal(member.open_count, 0); assert.equal(member.closed_count, 1);
  });
  await t.test('setup 재실행 후 회원과 모집 글 데이터 보존', async () => {
    await initialize(env);
    assert.equal((await request('/studies/' + studyId)).body.title, '수학 마감 안내');
    assert.equal((await request('/users/me', 'GET', undefined, a)).status, 200);
  });
  await t.test('본인 스터디 삭제 및 404', async () => {
    assert.equal((await request('/studies/' + studyId, 'DELETE', undefined, a)).status, 200);
    assert.equal((await request('/studies/' + studyId)).status, 404);
    const member = (await request('/studies/member-summary')).body.find(row => row.member_id === aid);
    assert.equal(member.total_count, 0); assert.equal(member.open_count, 0); assert.equal(member.closed_count, 0);
  });
  await t.test('탈퇴 시 본인 스터디 삭제 및 기존 토큰 무효화', async () => {
    const p = await request('/studies', 'POST', sample, b);
    assert.equal((await request('/users/me', 'DELETE', { currentPassword: 'wrong' }, b)).status, 400);
    assert.equal((await request('/users/me', 'DELETE', { currentPassword: pass }, b)).status, 200);
    assert.equal((await request('/studies/' + p.body.studyId)).status, 404);
    assert.equal((await request('/users/me', 'GET', undefined, b)).status, 401);
    assert.equal((await request('/studies', 'POST', sample, b)).status, 401);
    assert.equal((await request('/users/login', 'POST', { email: prefix + 'b@example.test', password: pass })).status, 401);
    assert.equal((await request('/users/me', 'DELETE', { currentPassword: pass }, a)).status, 200);
    const summary = (await request('/studies/member-summary')).body;
    assert.ok(!summary.some(row => row.member_id === aid || row.member_id === bid));
  });
});
