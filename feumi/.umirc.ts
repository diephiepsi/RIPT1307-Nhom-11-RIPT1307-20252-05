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
      path:"/admin/dashboard",
      component:"admin/dashboard",
      wrappers:["@/wrappers/requireAdmin"]
    },

    { path: "/docs", component: "docs" },
  ],

  npmClient: "yarn",

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