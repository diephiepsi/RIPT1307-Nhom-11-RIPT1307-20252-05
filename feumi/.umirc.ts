import { defineConfig } from "umi";

export default defineConfig({
  routes: [
    { path: "/", component: "index" },
    { path: "/login", component: "login" },
    { path: "/register", component: "register" },
    { path: "/questions", component: "questions/index" },
    { path: "/questions/:id", component: "questions/detail" },
    { path: "/ask", component: "ask", wrappers: ["@/wrappers/requireAuth"] },
    {
      path: "/admin/posts",
      component: "admin/posts",
      wrappers: ["@/wrappers/requireAdmin"],
    },
    {
      path: "/admin/users",
      component: "admin/users",
      wrappers: ["@/wrappers/requireAdmin"],
    },
    {
      path: "/admin/dashboard",
      component: "admin/dashboard",
      wrappers: ["@/wrappers/requireAdmin"],
    },
    { path: "/docs", component: "docs" },
  ],

  npmClient: "npm",
  esbuildMinifyIIFE: true,

  define: {
    "process.env.API_BASE_URL": process.env.API_BASE_URL,
    "process.env.VITE_API_BASE_URL": process.env.VITE_API_BASE_URL,
    "process.env.UMI_APP_API_URL": process.env.UMI_APP_API_URL,
  },

  proxy: {
    "/api": {
      target: "http://localhost:3000",
      changeOrigin: true,
      secure: false,
    },
    "/socket.io": {
      target: "http://localhost:3000",
      changeOrigin: true,
      ws: true,
    },
  },
});
