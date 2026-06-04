-- ============================================================
-- Diễn đàn Hỏi Đáp Sinh viên — MySQL
-- Database: student_forum
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
  id          VARCHAR(30)  NOT NULL,
  title       VARCHAR(255) NOT NULL,
  content     LONGTEXT     NOT NULL,
  is_approved TINYINT(1)   NOT NULL DEFAULT 0, -- THÊM CỘT DUYỆT BÀI TẠI ĐÂY
  user_id     VARCHAR(30)  NOT NULL,
  deleted_at  DATETIME(3)  NULL,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
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
-- 4. Bài đăng — Tag
-- =========================
CREATE TABLE post_tags (
  post_id VARCHAR(30) NOT NULL,
  tag_id  VARCHAR(30) NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  CONSTRAINT fk_post_tags_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_post_tags_tag  FOREIGN KEY (tag_id)  REFERENCES tags(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 5. Bình luận
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
-- 6. Vote
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
-- 7. Dữ liệu mẫu (Password mặc định: 123456)
-- =========================

-- Thêm Users (Có thêm 1 bạn làm team cùng bạn)
INSERT INTO users (id, full_name, email, password, role, is_locked) VALUES
('usr_admin001',   'Admin Hệ Thống', 'admin@gmail.com',   '$2b$10$YIWdSJ4NvqZYGcTsE/mV1OsTrOgk1Hl/Lf8u6ikd8Y7rbxR2TK/bC', 'ADMIN',    0),
('usr_student001', 'Nguyễn Văn Điệp','student@gmail.com', '$2b$10$YIWdSJ4NvqZYGcTsE/mV1OsTrOgk1Hl/Lf8u6ikd8Y7rbxR2TK/bC', 'STUDENT',  0),
('usr_student002', 'Lê Trọng Mai',   'mai@gmail.com',     '$2b$10$YIWdSJ4NvqZYGcTsE/mV1OsTrOgk1Hl/Lf8u6ikd8Y7rbxR2TK/bC', 'STUDENT',  0),
('usr_teacher001', 'Giảng viên A',   'teacher@gmail.com', '$2b$10$YIWdSJ4NvqZYGcTsE/mV1OsTrOgk1Hl/Lf8u6ikd8Y7rbxR2TK/bC', 'LECTURER', 0);

-- Tags
INSERT INTO tags (id, name) VALUES
('tag_react',       'ReactJS'),
('tag_express',     'Express.js'),
('tag_nodejs',      'Node.js'),
('tag_mysql',       'MySQL'),
('tag_algorithm',   'Thuật toán');

-- Posts (Có bài đã duyệt và chưa duyệt)
INSERT INTO posts (id, title, content, is_approved, user_id) VALUES
('post_001', 'Sự khác biệt giữa ReactJS và Angular là gì?',
 'Em đang học môn Lập trình Web và phân vân không biết nên dùng ReactJS thay thế Angular trong trường hợp nào ạ?', 
 1, 'usr_student001'), -- Bài này đã duyệt

('post_002', 'Tìm hiểu cách truyền tham số qua URL trong React Router',
 'Mọi người cho em hỏi làm sao để lấy ID từ URL trong React Router v6 ạ?', 
 1, 'usr_student002'), -- Bài này đã duyệt

('post_003', 'Hướng dẫn quản lý State với Redux',
 'Em viết bài này để chia sẻ cách cấu trúc các thành phần của Redux trong đồ án thực tế.', 
 0, 'usr_student001'); -- Bài này CHƯA DUYỆT (Đang chờ Admin)

-- Post — Tag
INSERT INTO post_tags (post_id, tag_id) VALUES
('post_001', 'tag_react'),
('post_002', 'tag_react'),
('post_003', 'tag_react'),
('post_003', 'tag_nodejs');

-- Comments
INSERT INTO comments (id, content, post_id, user_id, parent_id) VALUES
('cmt_001', 'ReactJS linh hoạt hơn, nó là thư viện chứ không phải framework cồng kềnh như Angular.', 'post_001', 'usr_teacher001', NULL),
('cmt_002', 'Em có thể dùng hook useParams() của React Router nhé.', 'post_002', 'usr_student001', NULL),
('cmt_003', 'Cảm ơn thầy ạ!', 'post_001', 'usr_student001', 'cmt_001');

-- Votes
INSERT INTO votes (id, value, user_id, post_id, comment_id) VALUES
('vote_p001', 1, 'usr_teacher001', 'post_001', NULL),
('vote_p002', 1, 'usr_teacher001', 'post_002', NULL),
('vote_c001', 1, 'usr_student002', NULL, 'cmt_001');






