import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { AuthState, AuthUser, Role } from '../models/auth';
import { api } from '../services/api';
import { storage } from '../services/storage';

type LoginPayload = { email: string; password: string };
type RegisterPayload = { email: string; password: string; fullName: string; role: Exclude<Role, 'ADMIN'> };

type AuthResponse = { token: string; user: AuthUser };

export const login = createAsyncThunk<AuthResponse, LoginPayload>('auth/login', async (payload) => {
  const { data } = await api.post<AuthResponse>('/auth/login', payload);
  return data;
});

export const register = createAsyncThunk<AuthResponse, RegisterPayload>('auth/register', async (payload) => {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  return data;
});

export const fetchMe = createAsyncThunk<AuthUser>('auth/me', async () => {
  const { data } = await api.get<AuthUser>('/auth/me');
  return data;
});

const initialState: AuthState = {
  token: storage.getToken(),
  user: null,
  status: 'idle',
};

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.status = 'idle';
      storage.clearToken();
    },
  },
  extraReducers: (builder) => {
    builder
      // Xử lý Login
      .addCase(login.pending, (s) => {
        s.status = 'loading';
      })
      .addCase(login.fulfilled, (s, a) => {
        s.status = 'idle';
        s.token = a.payload.token;
        s.user = a.payload.user;
        storage.setToken(a.payload.token);
      })
      .addCase(login.rejected, (s) => {
        s.status = 'failed';
      })
      
      // Xử lý Register
      .addCase(register.fulfilled, (s, a) => {
        s.status = 'idle';
        s.token = a.payload.token;
        s.user = a.payload.user;
        storage.setToken(a.payload.token);
      })
      
      // Xử lý Khôi phục phiên làm việc (Get Profile khi F5)
      .addCase(fetchMe.pending, (s) => {
        s.status = 'loading';
      })
      .addCase(fetchMe.fulfilled, (s, a) => {
        s.status = 'idle';
        s.user = a.payload; // Khôi phục thông tin user thành công
      })
      .addCase(fetchMe.rejected, (s) => {
        s.status = 'failed';
        s.token = null;
        s.user = null;
        storage.clearToken(); // Token cũ đã hết hạn hoặc không hợp lệ -> Xóa sạch để user đăng nhập lại
      });
  },
});

export const { logout } = slice.actions;
export const authReducer = slice.reducer;