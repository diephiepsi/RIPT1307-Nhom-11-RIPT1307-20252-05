import React, { useState } from 'react';
import { Button, Card, Form, Input, message } from 'antd';
import { history, useModel } from 'umi'; // Dùng thư viện chuẩn của UmiJS

export default function LoginPage() { // Thêm chữ default để Umi nhận diện trang
  // 1. Gọi Model thay vì dùng Redux Dispatch
  const { login } = useModel('useAuthModel'); 
  const [loading, setLoading] = useState(false);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 150px)',
      backgroundColor: '#f8f9fa',
      fontFamily: 'sans-serif'
    }}>
      
      {/* 1. LOGO PHONG CÁCH STACK OVERFLOW */}
      <div 
        onClick={() => history.push('/')} // 2. Đổi nav('/') thành history.push('/')
        style={{ 
          fontSize: '2.2rem', 
          fontWeight: 'bold', 
          color: '#0c0d0e', 
          marginBottom: '24px', 
          cursor: 'pointer',
          userSelect: 'none',
          letterSpacing: '-0.5px'
        }}
      >
        UniBrain<span style={{ color: '#0c0d0e', fontWeight: 300 }}>.com</span>
      </div>

      {/* 2. KHỐI BOX ĐĂNG NHẬP (CARD) */}
      <Card 
        style={{ 
          width: '100%',
          maxWidth: '310px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05), 0 5px 10px rgba(0, 0, 0, 0.03)',
          borderRadius: '7px',
          border: '1px solid #e3e6e8',
          backgroundColor: '#ffffff'
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <Form
          layout="vertical"
          requiredMark={false}
          onFinish={async (values) => {
            setLoading(true);
            try {
              // Chỗ này sau này bạn thay bằng API gọi Backend thực tế
              // Ví dụ: const res = await authService.login(values);
              const mockUser = { email: values.email, role: 'USER' };
              
              // Lưu vào State của Umi
              login(mockUser); 
              message.success('Đăng nhập thành công');
              history.push('/');
            } catch {
              message.error('Đăng nhập thất bại');
            } finally {
              setLoading(false);
            }
          }}
        >
          {/* Ô nhập Email */}
          <Form.Item 
            name="email" 
            label={<span style={{ fontWeight: 600, color: '#0c0d0e', fontSize: '0.9rem' }}>Email</span>}
            rules={[{ required: true, message: 'Vui lòng nhập Email', type: 'email' }]}
            style={{ marginBottom: '16px' }}
          >
            <Input style={{ borderRadius: '3px', padding: '8px' }} />
          </Form.Item>

          {/* Ô nhập Mật khẩu */}
          <Form.Item 
            name="password" 
            label={
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: '#0c0d0e', fontSize: '0.9rem' }}>Password</span>
              </div>
            }
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
            style={{ marginBottom: '20px' }}
          >
            <Input.Password style={{ borderRadius: '3px', padding: '8px' }} />
          </Form.Item>

          {/* Nút Submit */}
          <Button 
            type="primary" 
            htmlType="submit" 
            block
            loading={loading}
            style={{
              backgroundColor: '#0a95ff',
              borderColor: 'transparent',
              borderRadius: '3px',
              height: '38px',
              fontWeight: 500,
              fontSize: '0.9rem'
            }}
          >
            Log in
          </Button>
        </Form>
      </Card>

      {/* 3. DÒNG ĐIỀU HƯỚNG PHỤ PHÍA DƯỚI BOX */}
      <div style={{ marginTop: '24px', fontSize: '0.85rem', color: '#232629' }}>
        Don't have an account?{' '}
        <span 
          onClick={() => history.push('/register')} // 3. Đổi nav thành history
          style={{ color: '#0074cc', cursor: 'pointer', textDecoration: 'none' }}
        >
          Sign up
        </span>
      </div>

    </div>
  );
}