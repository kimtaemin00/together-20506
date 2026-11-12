import express from 'express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import db from './db.js';
import usersRouter from './routes/users.js';
import studiesRouter from './routes/studies.js';
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
app.get('/api/health', async (req, res) => {
  const [[users]] = await db.query('SELECT COUNT(*) AS count FROM users');
  const [[studies]] = await db.query('SELECT COUNT(*) AS count FROM study_posts');
  res.json({ status: 'ok', database: 'connected', users: users.count, studies: studies.count });
});
app.use('/api/users', usersRouter);
app.use('/api/studies', studiesRouter);
app.use('/api', (req, res) => res.status(404).json({ message: '없는 API 주소입니다.' }));
const dist = fileURLToPath(new URL('../client/dist/', import.meta.url));
const index = fileURLToPath(new URL('../client/dist/index.html', import.meta.url));
app.use(express.static(dist));
app.use((req, res) => {
  if (req.method === 'GET' && req.accepts('html') && existsSync(index)) return res.sendFile(index);
  res.status(404).send('화면 빌드가 없으면 프로젝트 루트에서 npm run build를 실행하세요.');
});
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: '이미 등록된 이메일, 전화번호 또는 학번입니다.' });
  const status = error.status >= 400 && error.status < 500 ? error.status : 500;
  if (status === 500) console.error('요청 처리 실패:', error.code || error.name);
  res.status(status).json({ message: status === 500 ? 'DB 연결 또는 서버 오류입니다. 서버 터미널을 확인하세요.' : error.message });
});
try {
  await db.query('SELECT id,email,password,nickname,phone_number,entry_year,student_id FROM users LIMIT 0');
  await db.query('SELECT id,owner_id,title,description,subject,schedule,meeting_place,target_grade,capacity,status FROM study_posts LIMIT 0');
  const server = app.listen(config.port, config.host, () => console.log('MySQL 연결 성공 · http://localhost:' + config.port));
  server.on('error', async (error) => {
    console.error(error.code === 'EADDRINUSE' ? '포트가 사용 중입니다. 기존 서버를 닫거나 .env의 PORT를 바꾸세요.' : error.code);
    await db.end(); process.exitCode = 1;
  });
  const stop = () => server.close(async () => { await db.end(); process.exit(0); });
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
} catch (error) {
  console.error('DB 준비 실패 (' + (error.code || error.name) + '). MySQL 서비스를 켜고 npm run db:init을 실행하세요. DB 계정·비밀번호는 server/.env에서 확인합니다.');
  await db.end(); process.exitCode = 1;
}
