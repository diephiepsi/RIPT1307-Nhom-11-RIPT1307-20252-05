import "dotenv/config";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function main() {
  const password = await bcrypt.hash("123456", 10);

  console.log("Đang xóa dữ liệu cũ...");

  // Xóa theo đúng thứ tự khóa ngoại
  await prisma.notification.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.questionTag.deleteMany();
  await prisma.question.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

  console.log("Đang seed users...");

  await prisma.user.createMany({
    data: [
      {
        id: "usr_admin001",
        email: "admin@gmail.com",
        fullName: "Admin Hệ Thống",
        password,
        role: "ADMIN",
        locked: false,
      },
      {
        id: "usr_student001",
        email: "student@gmail.com",
        fullName: "Nguyễn Văn Điệp",
        password,
        role: "STUDENT",
        locked: false,
      },
      {
        id: "usr_student002",
        email: "mai@gmail.com",
        fullName: "Lê Trọng Mai",
        password,
        role: "STUDENT",
        locked: false,
      },
      {
        id: "usr_teacher001",
        email: "teacher@gmail.com",
        fullName: "Giảng viên A",
        password,
        role: "LECTURER",
        locked: false,
      },
    ],
  });

  console.log("Đang seed tags...");

  await prisma.tag.createMany({
    data: [
      { id: "tag_react", name: "ReactJS" },
      { id: "tag_express", name: "Express.js" },
      { id: "tag_nodejs", name: "Node.js" },
      { id: "tag_mysql", name: "MySQL" },
      { id: "tag_algorithm", name: "Thuật toán" },
      { id: "tag_prisma", name: "Prisma" },
      { id: "tag_typescript", name: "TypeScript" },
    ],
  });

  console.log("Đang seed posts/questions...");

  await prisma.question.createMany({
    data: [
      {
        id: "post_001",
        title: "Sự khác biệt giữa ReactJS và Angular là gì?",
        content:
          "Em đang học môn Lập trình Web và phân vân không biết nên dùng ReactJS thay thế Angular trong trường hợp nào ạ?",
        authorId: "usr_student001",
        isApproved: true,
        viewsCount: 128,
        createdAt: daysAgo(5),
      },
      {
        id: "post_002",
        title: "Cách truyền tham số qua URL trong React Router v6?",
        content:
          "Mọi người cho em hỏi làm sao để lấy ID từ URL trong React Router v6 ạ?",
        authorId: "usr_student002",
        isApproved: true,
        viewsCount: 86,
        createdAt: daysAgo(3),
      },
      {
        id: "post_003",
        title: "Quản lý state với Redux Toolkit nên tổ chức thư mục thế nào?",
        content:
          "Em muốn hỏi cách cấu trúc Redux Toolkit trong đồ án thực tế để dễ bảo trì.",
        authorId: "usr_student001",
        isApproved: true,
        viewsCount: 44,
        createdAt: daysAgo(1),
      },
      {
        id: "post_004",
        title: "Prisma relation include bị lỗi thì sửa thế nào?",
        content:
          "Em dùng Prisma với MySQL, khi include user và tags thì TypeScript báo lỗi. Nên sửa schema hay sửa query ạ?",
        authorId: "usr_student002",
        isApproved: true,
        viewsCount: 210,
        createdAt: hoursAgo(8),
      },
    ],
  });

  console.log("Đang seed post_tags...");

  await prisma.questionTag.createMany({
    data: [
      { questionId: "post_001", tagId: "tag_react" },
      { questionId: "post_001", tagId: "tag_typescript" },

      { questionId: "post_002", tagId: "tag_react" },

      { questionId: "post_003", tagId: "tag_react" },
      { questionId: "post_003", tagId: "tag_nodejs" },

      { questionId: "post_004", tagId: "tag_prisma" },
      { questionId: "post_004", tagId: "tag_mysql" },
      { questionId: "post_004", tagId: "tag_typescript" },
    ],
  });

  console.log("Đang seed comments...");

  // Tạo comment cha trước
  await prisma.comment.createMany({
    data: [
      {
        id: "cmt_001",
        content:
          "ReactJS linh hoạt hơn, nó là thư viện UI. Angular là framework đầy đủ hơn, phù hợp dự án lớn có quy chuẩn chặt.",
        questionId: "post_001",
        authorId: "usr_teacher001",
        parentId: null,
        createdAt: daysAgo(4),
      },
      {
        id: "cmt_002",
        content:
          "Em có thể dùng hook useParams() của React Router để lấy id từ URL nhé.",
        questionId: "post_002",
        authorId: "usr_teacher001",
        parentId: null,
        createdAt: daysAgo(2),
      },
      {
        id: "cmt_004",
        content:
          "Nên chia theo feature: postsSlice, authSlice, commentsSlice. Không nên gom toàn bộ state vào một file.",
        questionId: "post_003",
        authorId: "usr_student002",
        parentId: null,
        createdAt: hoursAgo(16),
      },
      {
        id: "cmt_005",
        content:
          "Với Prisma, em kiểm tra lại tên relation trong schema.prisma rồi chạy yarn prisma generate.",
        questionId: "post_004",
        authorId: "usr_teacher001",
        parentId: null,
        createdAt: hoursAgo(6),
      },
    ],
  });

  // Tạo comment reply sau để tránh lỗi parent_id
  await prisma.comment.create({
    data: {
      id: "cmt_003",
      content:
        "Cảm ơn thầy ạ, vậy đồ án nhỏ thì ReactJS hợp lý hơn đúng không ạ?",
      questionId: "post_001",
      authorId: "usr_student001",
      parentId: "cmt_001",
      createdAt: daysAgo(3),
    },
  });

  console.log("Đang seed votes...");

  await prisma.vote.createMany({
    data: [
      // Vote bài viết
      {
        id: "vote_p001",
        value: 1,
        userId: "usr_teacher001",
        questionId: "post_001",
        commentId: null,
      },
      {
        id: "vote_p002",
        value: 1,
        userId: "usr_student002",
        questionId: "post_001",
        commentId: null,
      },
      {
        id: "vote_p003",
        value: -1,
        userId: "usr_student001",
        questionId: "post_002",
        commentId: null,
      },
      {
        id: "vote_p004",
        value: 1,
        userId: "usr_teacher001",
        questionId: "post_002",
        commentId: null,
      },
      {
        id: "vote_p005",
        value: 1,
        userId: "usr_teacher001",
        questionId: "post_003",
        commentId: null,
      },
      {
        id: "vote_p006",
        value: 1,
        userId: "usr_student001",
        questionId: "post_004",
        commentId: null,
      },
      {
        id: "vote_p007",
        value: 1,
        userId: "usr_teacher001",
        questionId: "post_004",
        commentId: null,
      },
      {
        id: "vote_p008",
        value: -1,
        userId: "usr_student002",
        questionId: "post_004",
        commentId: null,
      },

      // Vote bình luận
      {
        id: "vote_c001",
        value: 1,
        userId: "usr_student001",
        questionId: null,
        commentId: "cmt_001",
      },
      {
        id: "vote_c002",
        value: 1,
        userId: "usr_student002",
        questionId: null,
        commentId: "cmt_001",
      },
      {
        id: "vote_c003",
        value: 1,
        userId: "usr_student001",
        questionId: null,
        commentId: "cmt_002",
      },
      {
        id: "vote_c004",
        value: 1,
        userId: "usr_student002",
        questionId: null,
        commentId: "cmt_005",
      },
    ],
  });

  console.log("Đang seed bookmarks...");

  await prisma.bookmark.createMany({
    data: [
      {
        id: "bm_001",
        userId: "usr_student001",
        questionId: "post_004",
      },
      {
        id: "bm_002",
        userId: "usr_student002",
        questionId: "post_001",
      },
      {
        id: "bm_003",
        userId: "usr_teacher001",
        questionId: "post_003",
      },
    ],
  });

  console.log("Seed dữ liệu thành công!");
  console.log("Admin: admin@gmail.com / 123456");
  console.log("Student: student@gmail.com / 123456");
  console.log("Teacher: teacher@gmail.com / 123456");
  console.log("Student 2: mai@gmail.com / 123456");
}

main()
  .catch((error) => {
    console.error("Seed lỗi:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
