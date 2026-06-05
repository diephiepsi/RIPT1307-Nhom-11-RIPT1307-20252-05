import { defineConfig } from "umi";

export default defineConfig({
  npmClient: 'yarn',
  // Khai báo bật plugin Ant Design và Model
  plugins: [
    '@umijs/plugins/dist/model', 
    '@umijs/plugins/dist/antd'
  ],
  model: {}, // Bật kho chứa state (thay thế Redux)
  antd: {},  // Bật thư viện giao diện
  routes: [
    { path: "/", component: "index" },
    { path: "/login", component: "auth/LoginPage" },
    { path: "/register", component: "auth/RegisterPage" },
    { path: "/questions", component: "questions/QuestionsPage" },
    { path: "/questions/:id", component: "questions/QuestionDetailPage" },
    { path: "/ask", component: "questions/AskQuestionPage" },
    { path: "/questions/:id", component: "questions/QuestionDetailPage" },
    { path: "/admin/users", component: "admin/AdminUsersPage" },
    { path: "/admin/posts", component: "admin/AdminPostsPage" },

  ],
});