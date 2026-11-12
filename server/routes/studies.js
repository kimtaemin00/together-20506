import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middlewares/auth.js';
import { id, study, reject } from '../validation.js';
const router = express.Router();
// 작성자의 개인정보 대신 닉네임만 공개합니다. 목록과 JOIN 메뉴가 같은 실제 JOIN 결과를 사용합니다.
const joined = 'SELECT s.*, u.nickname AS author_nickname FROM study_posts s JOIN users u ON s.owner_id = u.id';
router.get('/', async (req, res) => {
  const subject = req.query.subject;
  const filtered = typeof subject === 'string' && subject && subject !== '전체';
  const [rows] = await db.execute(joined + (filtered ? ' WHERE s.subject=?' : '') + ' ORDER BY s.created_at DESC,s.id DESC', filtered ? [subject] : []);
  res.json(rows);
});
// 두 번째 JOIN: 글이 없는 회원도 포함하여 작성자별 모집 상태를 집계합니다.
// 같은 닉네임을 가진 회원도 각각 집계하도록 회원 ID로 구분합니다.
router.get('/member-summary', async (req, res) => {
  const [rows] = await db.execute(`
    SELECT u.id AS member_id, u.nickname,
           COUNT(s.id) AS total_count,
           COUNT(CASE WHEN s.status = 'OPEN' THEN s.id END) AS open_count,
           COUNT(CASE WHEN s.status = 'CLOSED' THEN s.id END) AS closed_count
    FROM users u
    LEFT JOIN study_posts s ON s.owner_id = u.id
    GROUP BY u.id, u.nickname
    ORDER BY total_count DESC, u.id ASC
  `);
  res.json(rows);
});
router.get('/:id', async (req, res) => {
  const [rows] = await db.execute(joined + ' WHERE s.id=?', [id(req.params.id)]);
  if (!rows.length) reject('모집 글을 찾을 수 없습니다.', 404);
  res.json(rows[0]);
});
router.post('/', authenticateToken, async (req, res) => {
  const s = study(req.body);
  const [result] = await db.execute(
    'INSERT INTO study_posts (owner_id,title,description,subject,meeting_place,schedule,target_grade,capacity,status) VALUES (?,?,?,?,?,?,?,?,?)',
    [req.user.userId,s.title,s.description,s.subject,s.meeting_place,s.schedule,s.target_grade,s.capacity,s.status]);
  res.status(201).json({ message: '스터디 모집 글이 등록되었습니다.', studyId: result.insertId });
});
async function checkOwner(studyId, userId) {
  const [rows] = await db.execute('SELECT owner_id FROM study_posts WHERE id=?', [studyId]);
  if (!rows.length) reject('모집 글을 찾을 수 없습니다.', 404);
  if (rows[0].owner_id !== userId) reject('본인이 작성한 모집 글만 변경할 수 있습니다.', 403);
}
router.put('/:id', authenticateToken, async (req, res) => {
  const studyId = id(req.params.id);
  await checkOwner(studyId, req.user.userId);
  const s = study(req.body);
  const [result] = await db.execute(
    'UPDATE study_posts SET title=?,description=?,subject=?,meeting_place=?,schedule=?,target_grade=?,capacity=?,status=? WHERE id=? AND owner_id=?',
    [s.title,s.description,s.subject,s.meeting_place,s.schedule,s.target_grade,s.capacity,s.status,studyId,req.user.userId]);
  if (!result.affectedRows) reject('모집 글을 찾을 수 없습니다.', 404);
  res.json({ message: '모집 글을 수정했습니다.' });
});
router.delete('/:id', authenticateToken, async (req, res) => {
  const studyId = id(req.params.id);
  await checkOwner(studyId, req.user.userId);
  const [result] = await db.execute('DELETE FROM study_posts WHERE id=? AND owner_id=?', [studyId,req.user.userId]);
  if (!result.affectedRows) reject('모집 글을 찾을 수 없습니다.', 404);
  res.json({ message: '모집 글을 삭제했습니다.' });
});
export default router;
