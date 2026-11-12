import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { initialize } from './database.mjs';
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });
try {
  if (!process.env.DB_USER) throw new Error('먼저 npm run setup을 실행하거나 server/.env를 작성하세요.');
  await initialize(process.env); console.log('MySQL 연결 및 users/study_posts 테이블 확인 성공');
} catch (error) { console.error(error.safeMessage || error.message); process.exitCode = 1; }
