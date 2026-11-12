import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { config } from '../config.js';
import { authenticateToken } from '../middlewares/auth.js';
import { password, profile, reject, text } from '../validation.js';

const router = express.Router();
const fields = 'id, email, nickname, phone_number, entry_year, student_id, created_at';
const tokenFor = (userId) => jwt.sign({ userId }, config.secret, { expiresIn: '2h', algorithm: 'HS256' });
router.post('/signup', async (req, res) => {
  const data = profile(req.body);
  const email = text(req.body.email, '이메일', 100).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) reject('이메일 형식을 확인하세요.');
  const year = Number(req.body.entry_year);
  if (!Number.isInteger(year) || year < 2000 || year > new Date().getFullYear() + 1) reject('입학년도를 확인하세요.');
  const hash = await bcrypt.hash(password(req.body.password), 10);
  const [result] = await db.execute(
    'INSERT INTO users (email,password,nickname,phone_number,entry_year,student_id) VALUES (?,?,?,?,?,?)',
    [email, hash, data.nickname, data.phone_number, year, data.student_id]);
  res.status(201).json({ message: '가입되었습니다.', token: tokenFor(result.insertId) });
});
router.post('/login', async (req, res) => {
  const email = text(req.body.email, '이메일', 100).toLowerCase();
  if (typeof req.body.password !== 'string' || !req.body.password) reject('비밀번호를 입력하세요.');
  const [rows] = await db.execute('SELECT id,password FROM users WHERE email = ?', [email]);
  if (!rows.length || !(await bcrypt.compare(req.body.password, rows[0].password))) reject('이메일 또는 비밀번호가 일치하지 않습니다.', 401);
  res.json({ message: '로그인되었습니다.', token: tokenFor(rows[0].id) });
});
router.get('/me', authenticateToken, async (req, res) => {
  const [rows] = await db.execute('SELECT ' + fields + ' FROM users WHERE id = ?', [req.user.userId]);
  res.json(rows[0]);
});
async function verifyPassword(userId, currentPassword) {
  if (typeof currentPassword !== 'string' || !currentPassword) reject('현재 비밀번호를 입력하세요.');
  const [rows] = await db.execute('SELECT password FROM users WHERE id = ?', [userId]);
  if (!rows.length || !(await bcrypt.compare(currentPassword, rows[0].password))) reject('현재 비밀번호가 일치하지 않습니다.');
}
router.put('/me', authenticateToken, async (req, res) => {
  const data = profile(req.body);
  await verifyPassword(req.user.userId, req.body.currentPassword);
  // 이메일과 입학년도는 유지하고 비밀번호 비교는 서버에서만 수행합니다.
  await db.execute('UPDATE users SET nickname=?, phone_number=?, student_id=? WHERE id=?',
    [data.nickname, data.phone_number, data.student_id, req.user.userId]);
  res.json({ message: '프로필이 수정되었습니다.' });
});
router.delete('/me', authenticateToken, async (req, res) => {
  await verifyPassword(req.user.userId, req.body.currentPassword);
  // ON DELETE CASCADE: 본인이 작성한 스터디 글도 함께 삭제합니다.
  await db.execute('DELETE FROM users WHERE id=?', [req.user.userId]);
  res.json({ message: '회원 탈퇴가 완료되었습니다.' });
});
export default router;
