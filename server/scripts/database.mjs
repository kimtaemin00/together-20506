import mysql from 'mysql2/promise';
import { readFile } from 'node:fs/promises';
export async function initialize(env) {
  const name = env.DB_NAME || 'together_20506';
  if (!/^[A-Za-z0-9_]+$/.test(name)) throw new Error('DB 이름은 영문, 숫자, 밑줄만 사용할 수 있습니다.');
  const options = { host: env.DB_HOST || '127.0.0.1', port: Number(env.DB_PORT || 3306), user: env.DB_USER,
    password: env.DB_PASSWORD || '', database: name, connectTimeout: 10000, multipleStatements: true };
  let db;
  try {
    try { db = await mysql.createConnection(options); }
    catch (error) {
      if (error.code !== 'ER_BAD_DB_ERROR') throw error;
      const admin = await mysql.createConnection({ ...options, database: undefined });
      try { await admin.query('CREATE DATABASE IF NOT EXISTS \x60' + name + '\x60 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'); }
      finally { await admin.end(); }
      db = await mysql.createConnection(options);
    }
    const sql = await readFile(new URL('../../db/schema.sql', import.meta.url), 'utf8');
    const tables = sql.replace(/\r\n/g, '\n').split('-- TABLES\n')[1].split('-- INSPECT\n')[0];
    for (const statement of tables.split(';').map(s => s.trim()).filter(Boolean)) {
      const match = /CREATE TABLE IF NOT EXISTS (users|study_posts)/.exec(statement);
      if (!match) throw new Error('schema.sql 테이블 구성을 확인하세요.');
      const [existing] = await db.execute('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME=?', [name, match[1]]);
      if (!existing.length) await db.query(statement);
    }
    // 기존 테이블을 임의로 삭제하거나 변경하지 않고 필요한 구조를 검사합니다.
    await db.query('SELECT id,email,password,nickname,phone_number,entry_year,student_id FROM users LIMIT 0');
    await db.query('SELECT id,owner_id,title,description,subject,schedule,meeting_place,target_grade,capacity,status,created_at,updated_at FROM study_posts LIMIT 0');
    const [fk] = await db.execute(
      "SELECT rc.DELETE_RULE FROM information_schema.REFERENTIAL_CONSTRAINTS rc JOIN information_schema.KEY_COLUMN_USAGE k ON rc.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND rc.CONSTRAINT_NAME=k.CONSTRAINT_NAME AND rc.TABLE_NAME=k.TABLE_NAME WHERE k.TABLE_SCHEMA=? AND k.TABLE_NAME='study_posts' AND k.COLUMN_NAME='owner_id' AND k.REFERENCED_TABLE_NAME='users' AND k.REFERENCED_COLUMN_NAME='id'",
      [name]);
    if (!fk.some(row => row.DELETE_RULE === 'CASCADE')) throw new Error('study_posts.owner_id → users.id 관계와 ON DELETE CASCADE가 필요합니다. 기존 데이터는 삭제하지 않았습니다. db/schema.sql과 비교하세요.');
  } catch (error) {
    const messages = {
      ECONNREFUSED: 'MySQL 서버에 연결할 수 없습니다. MySQL 서비스와 주소·포트를 확인하세요.',
      ER_ACCESS_DENIED_ERROR: 'MySQL 계정 또는 비밀번호가 맞지 않습니다. Workbench에서 연결되는 값을 입력하세요.',
      ER_DBACCESS_DENIED_ERROR: '이 계정에 해당 DB의 접근/생성 권한이 없습니다. 선생님이 지정한 DB와 계정을 확인하세요.',
      ER_TABLEACCESS_DENIED_ERROR: '테이블 생성 또는 조회 권한이 없습니다. 선생님이 지정한 계정 권한을 확인하세요.',
      ER_BAD_FIELD_ERROR: '기존 테이블 구조가 프로젝트와 다릅니다. 데이터는 삭제하지 않았습니다. db/schema.sql과 비교하세요.',
    };
    if (messages[error.code]) error.safeMessage = messages[error.code];
    else if (error.sql) error.safeMessage = 'DB 준비 오류 (' + error.code + '). Workbench에서 db/schema.sql 구조를 확인하세요.';
    throw error;
  } finally { if (db) await db.end(); }
}
