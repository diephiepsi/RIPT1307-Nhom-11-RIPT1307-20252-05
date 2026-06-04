import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { RequireAuth } from "./components/auth/RequireAuth";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { QuestionsPage } from "./pages/questions/QuestionsPage";
import { QuestionDetailPage } from "./pages/questions/QuestionDetailPage";
import { AskQuestionPage } from "./pages/questions/AskQuestionPage";
import { AdminPostsPage } from "./pages/admin/AdminPostsPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <QuestionsPage /> },

      { path: "questions", element: <QuestionsPage /> },

      { path: "questions/:id", element: <QuestionDetailPage /> },
      {
        path: "ask",
        element: (
          <RequireAuth>
            <AskQuestionPage />
          </RequireAuth>
        ),
      },
      {
        path: "admin/posts",
        element: (
          <RequireAuth roles={["ADMIN"]}>
            <AdminPostsPage />
          </RequireAuth>
        ),
      },
      {
        path: "admin/users",
        element: (
          <RequireAuth roles={["ADMIN"]}>
            <AdminUsersPage />
          </RequireAuth>
        ),
      },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
    ],
  },
]);
