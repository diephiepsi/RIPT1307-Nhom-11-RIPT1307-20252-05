import axios from "axios";
import { storage } from "./storage";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api",
});

api.interceptors.request.use((config) => {
  const token = storage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// CÁC HÀM GỌI API DÀNH RIÊNG CHO ADMIN

export const adminApi = {
  // --- QUẢN LÝ NGƯỜI DÙNG ---

  // 1. Lấy danh sách
  getUsers: () => api.get("/admin/users"),

  // 2. Thêm mới
  createUser: (data: any) => api.post("/admin/users", data),

  // 3. Sửa thông tin & Khóa/Mở khóa (Gọi phương thức PATCH khớp với Backend)
  updateUser: (
    id: string,
    data: { fullName?: string; role?: string; locked?: boolean },
  ) => api.patch(`/admin/users/${id}`, data),

  // 4. Xóa người dùng (Gọi phương thức DELETE khớp với Backend)
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

  // 5. Cấp lại mật khẩu
  resetPassword: (id: string) => api.post(`/admin/users/${id}/reset-password`),

  // --- QUẢN LÝ BÀI ĐĂNG ---

  // 1. Lấy danh sách bài đăng
  getPosts: () => api.get("/admin/posts"),

  // 2. Duyệt bài đăng (Hàm mới được thêm vào)
  approvePost: (id: string) => api.patch(`/admin/posts/${id}/approve`),

  // 3. Xóa bài đăng
  deletePost: (id: string) => api.delete(`/admin/posts/${id}`),
};
