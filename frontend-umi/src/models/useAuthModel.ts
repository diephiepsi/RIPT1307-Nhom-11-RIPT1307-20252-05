import { useState } from 'react';

// Model này sẽ thay thế hoàn toàn file authSlice.ts và store.ts cũ của bạn
export default function useAuthModel() {
  const [user, setUser] = useState<any>(null); // Lưu thông tin người đăng nhập
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false); // Trạng thái đăng nhập

  const login = (userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token'); // Xóa token khi đăng xuất
  };

  // Trả về những gì muốn dùng ở các trang khác
  return {
    user,
    isAuthenticated,
    login,
    logout,
  };
}