import { api } from './api';

export const adminService = {
  getUsers: () => api.get('/admin/users'),
  createUser: (data: any) => api.post('/admin/users', data),
  updateUser: (id: string, data: { fullName?: string; role?: string; locked?: boolean }) =>
    api.patch(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  resetPassword: (id: string) => api.post(`/admin/users/${id}/reset-password`),
  getPosts: () => api.get('/admin/posts'),
  approvePost: (id: string) => api.patch(`/admin/posts/${id}/approve`),
  deletePost: (id: string) => api.delete(`/admin/posts/${id}`),
  getStats: () => api.get('/admin/stats')
  
  
};
