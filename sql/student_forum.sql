-- ============================================================
-- Diễn đàn Hỏi Đáp Sinh viên — MySQL
-- Database: student_forum
-- Khớp với Prisma schema (backend Express + Prisma)
-- Chạy file này trong MySQL Workbench / phpMyAdmin / CLI
-- ============================================================

CREATE DATABASE IF NOT EXISTS student_forum
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE student_forum;

-- Xóa bảng cũ (nếu chạy lại script)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS post_tags;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- =========================
-- 1. Người dùng
-- role: STUDENT | LECTURER | ADMIN  (tương ứng sinh viên / giảng viên / admin)
-- =========================
CREATE TABLE users (
  id         VARCHAR(30)  NOT NULL,
  email      VARCHAR(150) NOT NULL,
  full_name  VARCHAR(100) NOT NULL,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('STUDENT', 'LECTURER', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
  is_locked  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 2. Bài đăng (câu hỏi) — bảng posts
-- =========================
CREATE TABLE posts (
  id         VARCHAR(30)  NOT NULL,
  title      VARCHAR(255) NOT NULL,
  content    LONGTEXT     NOT NULL,
  user_id    VARCHAR(30)  NOT NULL,
  deleted_at DATETIME(3)  NULL,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_posts_created_at (created_at),
  CONSTRAINT fk_posts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 3. Tag
-- =========================
CREATE TABLE tags (
  id   VARCHAR(30)  NOT NULL,
  name VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tags_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 4. Bài đăng — Tag (nhiều-nhiều)
-- =========================
CREATE TABLE post_tags (
  post_id VARCHAR(30) NOT NULL,
  tag_id  VARCHAR(30) NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  CONSTRAINT fk_post_tags_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_post_tags_tag  FOREIGN KEY (tag_id)  REFERENCES tags(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 5. Bình luận (parent_id = trả lời bình luận)
-- =========================
CREATE TABLE comments (
  id         VARCHAR(30) NOT NULL,
  content    TEXT        NOT NULL,
  post_id    VARCHAR(30) NOT NULL,
  user_id    VARCHAR(30) NOT NULL,
  parent_id  VARCHAR(30) NULL,
  deleted_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_comments_post_id (post_id),
  CONSTRAINT fk_comments_post   FOREIGN KEY (post_id)   REFERENCES posts(id)    ON DELETE CASCADE,
  CONSTRAINT fk_comments_user   FOREIGN KEY (user_id)   REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 6. Vote (bài + bình luận trong 1 bảng)
-- value: 1 = upvote, -1 = downvote
-- Mỗi user chỉ vote 1 lần / bài HOẶC 1 lần / bình luận
-- =========================
CREATE TABLE votes (
  id         VARCHAR(30) NOT NULL,
  value      INT         NOT NULL,
  user_id    VARCHAR(30) NOT NULL,
  post_id    VARCHAR(30) NULL,
  comment_id VARCHAR(30) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_vote_user_post    (user_id, post_id),
  UNIQUE KEY uq_vote_user_comment (user_id, comment_id),
  KEY idx_votes_post_id    (post_id),
  KEY idx_votes_comment_id (comment_id),
  CONSTRAINT fk_votes_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_votes_post    FOREIGN KEY (post_id)    REFERENCES posts(id)    ON DELETE CASCADE,
  CONSTRAINT fk_votes_comment FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  CONSTRAINT chk_vote_value CHECK (value IN (1, -1)),
  CONSTRAINT chk_vote_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL)
    OR (post_id IS NULL AND comment_id IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 7. Dữ liệu mẫu
-- Mật khẩu: 123456 (đã mã hóa bcrypt — backend dùng bcryptjs)
-- =========================

-- Users
INSERT INTO users (id, full_name, email, password, role, is_locked) VALUES
('usr_admin001',   'Admin',        'admin@gmail.com',   '$2b$10$YIWdSJ4NvqZYGcTsE/mV1OsTrOgk1Hl/Lf8u6ikd8Y7rbxR2TK/bC', 'ADMIN',    0),
('usr_student001', 'Nguyen Van A', 'student@gmail.com', '$2b$10$YIWdSJ4NvqZYGcTsE/mV1OsTrOgk1Hl/Lf8u6ikd8Y7rbxR2TK/bC', 'STUDENT',  0),
('usr_teacher001', 'Tran Thi B',   'teacher@gmail.com', '$2b$10$YIWdSJ4NvqZYGcTsE/mV1OsTrOgk1Hl/Lf8u6ikd8Y7rbxR2TK/bC', 'LECTURER', 0);

-- Tags
INSERT INTO tags (id, name) VALUES
('tag_react',       'React'),
('tag_nestjs',      'NestJS'),
('tag_mysql',       'MySQL'),
('tag_javascript',  'JavaScript'),
('tag_web',         'Lập trình web');

-- Posts (câu hỏi)
INSERT INTO posts (id, title, content, user_id) VALUES
('post_001', 'NestJS là gì?',
 'Em muốn hỏi NestJS dùng để làm backend như thế nào ạ?',
 'usr_student001'),
('post_002', 'Cách kết nối MySQL với NestJS?',
 'Em đang làm bài tập lớn và cần kết nối NestJS với MySQL.',
 'usr_student001');

-- Post — Tag
INSERT INTO post_tags (post_id, tag_id) VALUES
('post_001', 'tag_nestjs'),
('post_001', 'tag_web'),
('post_002', 'tag_nestjs'),
('post_002', 'tag_mysql');

-- Comments
INSERT INTO comments (id, content, post_id, user_id, parent_id) VALUES
('cmt_001', 'NestJS là framework backend của NodeJS, dùng TypeScript và cấu trúc module rõ ràng.', 'post_001', 'usr_teacher001', NULL),
('cmt_002', 'Bạn có thể dùng TypeORM hoặc Prisma để kết nối MySQL.', 'post_002', 'usr_teacher001', NULL),
('cmt_003', 'Em cảm ơn thầy/cô ạ.', 'post_001', 'usr_student001', 'cmt_001');

-- Votes bài đăng
INSERT INTO votes (id, value, user_id, post_id, comment_id) VALUES
('vote_p001', 1, 'usr_teacher001', 'post_001', NULL),
('vote_p002', 1, 'usr_teacher001', 'post_002', NULL);

-- Votes bình luận
INSERT INTO votes (id, value, user_id, post_id, comment_id) VALUES
('vote_c001', 1, 'usr_student001', NULL, 'cmt_001'),
('vote_c002', 1, 'usr_student001', NULL, 'cmt_002');


CREATE TABLE notifications (
  id           VARCHAR(30)  NOT NULL,
  recipient_id VARCHAR(30)  NOT NULL, -- Người nhận thông báo (chủ bài viết)
  sender_id    VARCHAR(30)  NOT NULL, -- Người thực hiện hành động (người comment/like)
  type         VARCHAR(20)  NOT NULL, -- 'LIKE' hoặc 'COMMENT'
  content      VARCHAR(255) NOT NULL, -- Nội dung hiển thị (Ví dụ: "Nguyễn Văn A đã bình luận...")
  target_id    VARCHAR(30)  NOT NULL, -- ID của câu hỏi để bấm vào là nhảy trang
  is_read      TINYINT   NOT NULL DEFAULT 0, -- 0: Chưa đọc, 1: Đã đọc
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_notifications_recipient (recipient_id),
  CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_sender    FOREIGN KEY (sender_id)    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


/