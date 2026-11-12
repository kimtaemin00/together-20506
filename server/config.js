import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)), quiet: true });
for (const name of ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET']) {
  if (!process.env[name]?.trim()) throw new Error(name + ' 설정이 없습니다. npm run setup을 실행하세요.');
}
if (process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET은 32자 이상이어야 합니다. npm run setup으로 생성하세요.');
export const config = {
  port: Number(process.env.PORT || 5000), host: process.env.HOST || '127.0.0.1', secret: process.env.JWT_SECRET,
  database: { host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD || '', database: process.env.DB_NAME },
};
for (const port of [config.port, config.database.port]) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('포트는 1~65535의 정수여야 합니다.');
}
