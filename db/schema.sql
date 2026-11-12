-- MySQL 8 이상. 새 DB용 SQL. 기존 지정 DB 사용 시 CREATE DATABASE/USE의 이름을 맞추세요.
-- setup은 .env의 DB_NAME을 사용하며 기존 회원/상품 데이터를 삭제하지 않습니다.
CREATE DATABASE IF NOT EXISTS together_20506 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE together_20506;
-- TABLES
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  entry_year INT NOT NULL,            -- 입학년도 (예: 2026)
  student_id VARCHAR(10) NOT NULL,    -- 학번 (숫자 5자리)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS study_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  subject VARCHAR(20) NOT NULL,
  meeting_place VARCHAR(100) NOT NULL,
  schedule VARCHAR(150) NOT NULL,
  target_grade VARCHAR(10) NOT NULL DEFAULT '전체',
  capacity INT NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_study_subject_status (subject, status),
  CONSTRAINT fk_study_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_study_capacity CHECK (capacity BETWEEN 2 AND 20),
  CONSTRAINT chk_study_status CHECK (status IN ('OPEN','CLOSED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- INSPECT
SHOW TABLES;
SHOW CREATE TABLE users;
SHOW CREATE TABLE study_posts;
SELECT s.id,s.title,s.subject,s.schedule,s.meeting_place,s.capacity,s.status,u.nickname AS author_nickname
FROM study_posts s JOIN users u ON s.owner_id=u.id
ORDER BY s.created_at DESC,s.id DESC;

-- JOIN 결과 2: 회원별 전체/모집 중/마감 집계 (글이 없는 회원도 0건)
SELECT u.id AS member_id, u.nickname,
       COUNT(s.id) AS total_count,
       COUNT(CASE WHEN s.status = 'OPEN' THEN s.id END) AS open_count,
       COUNT(CASE WHEN s.status = 'CLOSED' THEN s.id END) AS closed_count
FROM users u
LEFT JOIN study_posts s ON s.owner_id = u.id
GROUP BY u.id, u.nickname
ORDER BY total_count DESC, u.id ASC;
