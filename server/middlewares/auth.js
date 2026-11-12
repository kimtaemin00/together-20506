import jwt from 'jsonwebtoken';
import db from '../db.js';
import { config } from '../config.js';

export async function authenticateToken(req, res, next) {
  const match = /^Bearer (\S+)$/.exec(req.headers.authorization || '');
  if (!match) return res.status(401).json({ message: '로그인이 필요합니다.' });
  let payload;
  try { payload = jwt.verify(match[1], config.secret, { algorithms: ['HS256'] }); }
  catch { return res.status(401).json({ message: '로그인이 만료되었습니다. 다시 로그인하세요.' }); }
  if (!Number.isSafeInteger(payload.userId)) return res.status(401).json({ message: '올바른 로그인 정보가 아닙니다.' });
  // 탈퇴한 회원의 남은 토큰도 사용할 수 없도록 확인합니다.
  const [rows] = await db.execute('SELECT id FROM users WHERE id = ?', [payload.userId]);
  if (!rows.length) return res.status(401).json({ message: '탈퇴했거나 존재하지 않는 회원입니다.' });
  req.user = { userId: payload.userId };
  next();
}
