import { useEffect, useState } from 'react';
import { App as AntApp, ConfigProvider, theme, Spin } from 'antd';
import type { PropsWithChildren } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { fetchMe } from './store/authSlice';

export function App({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (token) {
      // Nếu máy còn lưu token, kích hoạt fetchMe để lấy lại dữ liệu user từ Backend
      dispatch(fetchMe())
        .unwrap()
        .finally(() => {
          setCheckingAuth(false);
        });
    } else {
      setCheckingAuth(false);
    }
  }, [dispatch, token]);

  // Trong lúc app đang đợi API phản hồi thông tin user, hiện màn hình chờ phẳng tinh tế
  if (checkingAuth) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: { borderRadius: 3, colorPrimary: '#0a95ff' },
      }}
    >
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  );
}