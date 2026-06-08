DROP DATABASE IF EXISTS student_forum;

CREATE DATABASE IF NOT EXISTS student_forum
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE student_forum;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS bookmarks;
DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS post_tags;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================
-- 1. Users
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
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 2. Posts / Questions
-- Prisma model: Question @@map("posts")
-- =========================
CREATE TABLE posts (
  id           VARCHAR(30)  NOT NULL,
  title        VARCHAR(255) NOT NULL,
  content      LONGTEXT     NOT NULL,
  is_approved  TINYINT(1)   NOT NULL DEFAULT 0,
  views_count  INT          NOT NULL DEFAULT 0,
  user_id      VARCHAR(30)  NOT NULL,
  deleted_at   DATETIME(3)  NULL,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  KEY idx_posts_user_id (user_id),
  KEY idx_posts_created_at (created_at),
  KEY idx_posts_views_count (views_count),
  KEY idx_posts_is_approved (is_approved),

  CONSTRAINT fk_posts_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 3. Tags
-- =========================
CREATE TABLE tags (
  id   VARCHAR(30)  NOT NULL,
  name VARCHAR(100) NOT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_tags_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 4. Post Tags
-- Prisma model: QuestionTag @@map("post_tags")
-- =========================
CREATE TABLE post_tags (
  post_id VARCHAR(30) NOT NULL,
  tag_id  VARCHAR(30) NOT NULL,

  PRIMARY KEY (post_id, tag_id),
  KEY idx_post_tags_tag_id (tag_id),

  CONSTRAINT fk_post_tags_post
    FOREIGN KEY (post_id) REFERENCES posts(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_post_tags_tag
    FOREIGN KEY (tag_id) REFERENCES tags(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 5. Comments / Answers
-- =========================
CREATE TABLE comments (
  id         VARCHAR(30) NOT NULL,
  content    TEXT        NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  post_id    VARCHAR(30) NOT NULL,
  user_id    VARCHAR(30) NOT NULL,
  parent_id  VARCHAR(30) NULL,

  PRIMARY KEY (id),
  KEY idx_comments_post_id (post_id),
  KEY idx_comments_user_id (user_id),
  KEY idx_comments_parent_id (parent_id),

  CONSTRAINT fk_comments_post
    FOREIGN KEY (post_id) REFERENCES posts(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_comments_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_comments_parent
    FOREIGN KEY (parent_id) REFERENCES comments(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 6. Votes
-- value = 1  => Like
-- value = -1 => Dislike
-- Lưu ý: đã xóa chk_vote_target để tránh lỗi Prisma db push
-- =========================
CREATE TABLE votes (
  id         VARCHAR(30) NOT NULL,
  value      INT         NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  user_id    VARCHAR(30) NOT NULL,
  post_id    VARCHAR(30) NULL,
  comment_id VARCHAR(30) NULL,

  PRIMARY KEY (id),

  UNIQUE KEY uq_vote_user_post (user_id, post_id),
  UNIQUE KEY uq_vote_user_comment (user_id, comment_id),

  KEY idx_votes_post_id (post_id),
  KEY idx_votes_comment_id (comment_id),
  KEY idx_votes_user_id (user_id),

  CONSTRAINT fk_votes_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_votes_post
    FOREIGN KEY (post_id) REFERENCES posts(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_votes_comment
    FOREIGN KEY (comment_id) REFERENCES comments(id)
    ON DELETE CASCADE,

  CONSTRAINT chk_vote_value CHECK (value IN (1, -1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 7. Bookmarks
-- =========================
CREATE TABLE bookmarks (
  id         VARCHAR(30) NOT NULL,
  user_id    VARCHAR(30) NOT NULL,
  post_id    VARCHAR(30) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),

  UNIQUE KEY uq_bookmark_user_post (user_id, post_id),
  KEY idx_bookmarks_user_id (user_id),
  KEY idx_bookmarks_post_id (post_id),

  CONSTRAINT fk_bookmarks_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_bookmarks_post
    FOREIGN KEY (post_id) REFERENCES posts(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 8. Notifications
-- Prisma model: Notification
-- id dùng uuid nên VARCHAR(36)
-- =========================
CREATE TABLE notifications (
  id           VARCHAR(36) NOT NULL,
  recipient_id VARCHAR(30) NOT NULL,
  sender_id    VARCHAR(30) NOT NULL,
  type         VARCHAR(50) NOT NULL,
  content      TEXT NOT NULL,
  target_id    VARCHAR(30) NOT NULL,
  is_read      TINYINT(1) NOT NULL DEFAULT 0,
  created_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  KEY idx_notifications_recipient_id (recipient_id),
  KEY idx_notifications_sender_id (sender_id),
  KEY idx_notifications_is_read (is_read),

  CONSTRAINT fk_notifications_recipient
    FOREIGN KEY (recipient_id) REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_notifications_sender
    FOREIGN KEY (sender_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 9. Seed Users
-- Password mẫu: 123456
-- =========================
INSERT INTO users (id, full_name, email, password, role, is_locked) VALUES
('usr_admin001',   'Admin Hệ Thống', 'admin@gmail.com',   '$2b$10$YIWdSJ4NvqZYGcTsE/mV1OsTrOgk1Hl/Lf8u6ikd8Y7rbxR2TK/bC', 'ADMIN',    0),
('usr_student001', 'Nguyễn Văn Điệp','student@gmail.com', '$2b$10$YIWdSJ4NvqZYGcTsE/mV1OsTrOgk1Hl/Lf8u6ikd8Y7rbxR2TK/bC', 'STUDENT',  0),
('usr_student002', 'Lê Trọng Mai',   'mai@gmail.com',     '$2b$10$YIWdSJ4NvqZYGcTsE/mV1OsTrOgk1Hl/Lf8u6ikd8Y7rbxR2TK/bC', 'STUDENT',  0),
('usr_teacher001', 'Giảng viên A',   'teacher@gmail.com', '$2b$10$YIWdSJ4NvqZYGcTsE/mV1OsTrOgk1Hl/Lf8u6ikd8Y7rbxR2TK/bC', 'LECTURER', 0);

-- =========================
-- 10. Seed Tags
-- =========================
INSERT INTO tags (id, name) VALUES
('tag_react',      'ReactJS'),
('tag_express',    'Express.js'),
('tag_nodejs',     'Node.js'),
('tag_mysql',      'MySQL'),
('tag_algorithm',  'Thuật toán'),
('tag_prisma',     'Prisma'),
('tag_typescript', 'TypeScript');

-- =========================
-- 11. Seed Posts
-- is_approved = 1 để bài hiện luôn ngoài trang chính
-- =========================
INSERT INTO posts (id, title, content, user_id, is_approved, views_count, created_at) VALUES
('post_001',
 'Sự khác biệt giữa ReactJS và Angular là gì?',
 'Em đang học môn Lập trình Web và phân vân không biết nên dùng ReactJS thay thế Angular trong trường hợp nào ạ?',
 'usr_student001', 1, 128, DATE_SUB(NOW(3), INTERVAL 5 DAY)),

('post_002',
 'Cách truyền tham số qua URL trong React Router v6?',
 'Mọi người cho em hỏi làm sao để lấy ID từ URL trong React Router v6 ạ?',
 'usr_student002', 1, 86, DATE_SUB(NOW(3), INTERVAL 3 DAY)),

('post_003',
 'Quản lý state với Redux Toolkit nên tổ chức thư mục thế nào?',
 'Em muốn hỏi cách cấu trúc Redux Toolkit trong đồ án thực tế để dễ bảo trì.',
 'usr_student001', 1, 44, DATE_SUB(NOW(3), INTERVAL 1 DAY)),

('post_004',
 'Prisma relation include bị lỗi thì sửa thế nào?',
 'Em dùng Prisma với MySQL, khi include user và tags thì TypeScript báo lỗi. Nên sửa schema hay sửa query ạ?',
 'usr_student002', 1, 210, DATE_SUB(NOW(3), INTERVAL 8 HOUR));

-- =========================
-- 12. Seed Post Tags
-- =========================
INSERT INTO post_tags (post_id, tag_id) VALUES
('post_001', 'tag_react'),
('post_001', 'tag_typescript'),
('post_002', 'tag_react'),
('post_003', 'tag_react'),
('post_003', 'tag_nodejs'),
('post_004', 'tag_prisma'),
('post_004', 'tag_mysql'),
('post_004', 'tag_typescript');

-- =========================
-- 13. Seed Comments
-- =========================
INSERT INTO comments (id, content, post_id, user_id, parent_id, created_at) VALUES
('cmt_001',
 'ReactJS linh hoạt hơn, nó là thư viện UI. Angular là framework đầy đủ hơn, phù hợp dự án lớn có quy chuẩn chặt.',
 'post_001', 'usr_teacher001', NULL, DATE_SUB(NOW(3), INTERVAL 4 DAY)),

('cmt_002',
 'Em có thể dùng hook useParams() của React Router để lấy id từ URL nhé.',
 'post_002', 'usr_teacher001', NULL, DATE_SUB(NOW(3), INTERVAL 2 DAY)),

('cmt_003',
 'Cảm ơn thầy ạ, vậy đồ án nhỏ thì ReactJS hợp lý hơn đúng không ạ?',
 'post_001', 'usr_student001', 'cmt_001', DATE_SUB(NOW(3), INTERVAL 3 DAY)),

('cmt_004',
 'Nên chia theo feature: postsSlice, authSlice, commentsSlice. Không nên gom toàn bộ state vào một file.',
 'post_003', 'usr_student002', NULL, DATE_SUB(NOW(3), INTERVAL 16 HOUR)),

('cmt_005',
 'Với Prisma, em kiểm tra lại tên relation trong schema.prisma rồi chạy yarn prisma generate.',
 'post_004', 'usr_teacher001', NULL, DATE_SUB(NOW(3), INTERVAL 6 HOUR));

-- =========================
-- 14. Seed Votes
-- =========================
INSERT INTO votes (id, value, user_id, post_id, comment_id) VALUES
('vote_p001',  1, 'usr_teacher001', 'post_001', NULL),
('vote_p002',  1, 'usr_student002', 'post_001', NULL),
('vote_p003', -1, 'usr_student001', 'post_002', NULL),
('vote_p004',  1, 'usr_teacher001', 'post_002', NULL),
('vote_p005',  1, 'usr_teacher001', 'post_003', NULL),
('vote_p006',  1, 'usr_student001', 'post_004', NULL),
('vote_p007',  1, 'usr_teacher001', 'post_004', NULL),
('vote_p008', -1, 'usr_student002', 'post_004', NULL),

('vote_c001',  1, 'usr_student001', NULL, 'cmt_001'),
('vote_c002',  1, 'usr_student002', NULL, 'cmt_001'),
('vote_c003',  1, 'usr_student001', NULL, 'cmt_002'),
('vote_c004',  1, 'usr_student002', NULL, 'cmt_005');

-- =========================
-- 15. Seed Bookmarks
-- =========================
INSERT INTO bookmarks (id, user_id, post_id) VALUES
('bm_001', 'usr_student001', 'post_004'),
('bm_002', 'usr_student002', 'post_001'),
('bm_003', 'usr_teacher001', 'post_003');

-- =========================
-- 16. Seed Notifications
-- =========================
INSERT INTO notifications
(id, recipient_id, sender_id, type, content, target_id, is_read, created_at)
VALUES
('notif_001', 'usr_admin001', 'usr_student001', 'NEW_POST', 'Có bài viết mới cần duyệt.', 'post_001', 0, DATE_SUB(NOW(3), INTERVAL 5 DAY)),
('notif_002', 'usr_student001', 'usr_teacher001', 'NEW_COMMENT', 'Có người trả lời câu hỏi của bạn.', 'post_001', 0, DATE_SUB(NOW(3), INTERVAL 4 DAY));

-- =========================
-- 17. Query kiểm tra nhanh
-- =========================
SELECT
  p.id,
  p.title,
  p.views_count,
  p.is_approved,
  COUNT(DISTINCT c.id) AS comments_count,
  SUM(CASE WHEN v.value = 1 THEN 1 ELSE 0 END) AS likes_count,
  SUM(CASE WHEN v.value = -1 THEN 1 ELSE 0 END) AS dislikes_count
FROM posts p
LEFT JOIN comments c
  ON c.post_id = p.id
  AND c.deleted_at IS NULL
LEFT JOIN votes v
  ON v.post_id = p.id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.title, p.views_count, p.is_approved
ORDER BY p.created_at DESC;