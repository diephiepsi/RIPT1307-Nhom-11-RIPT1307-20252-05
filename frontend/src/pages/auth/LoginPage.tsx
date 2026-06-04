import { App, Button, Card, Form, Input, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { login } from '../../store/authSlice';
import { useAppDispatch } from '../../store/hooks';

export function LoginPage() {
  const dispatch = useAppDispatch();
  const nav = useNavigate();
  const { message } = App.useApp();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 150px)', // Đẩy khối card vào giữa màn hình theo chiều dọc
      backgroundColor: '#f8f9fa',
      fontFamily: 'sans-serif'
    }}>
      
      {/* 1. LOGO PHONG CÁCH STACK OVERFLOW PHÍA TRÊN CARD */}
      <div 
        onClick={() => nav('/')}
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
          maxWidth: '310px', // Thu hẹp độ rộng vừa vặn chuẩn khung login quốc tế
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05), 0 5px 10px rgba(0, 0, 0, 0.03)',
          borderRadius: '7px',
          border: '1px solid #e3e6e8',
          backgroundColor: '#ffffff'
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <Form
          layout="vertical"
          requiredMark={false} // Ẩn dấu hoa thị đỏ để giao diện phẳng, thoáng đãng
          onFinish={async (values) => {
            try {
              await dispatch(login(values)).unwrap();
              message.success('Đăng nhập thành công');
              nav('/');
            } catch {
              message.error('Đăng nhập thất bại');
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
                <span style={{ color: '#0074cc', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 400 }}>
                  Forgot password?
                </span>
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
          onClick={() => nav('/register')} 
          style={{ color: '#0074cc', cursor: 'pointer', textDecoration: 'none' }}
        >
          Sign up
        </span>
      </div>

    </div>
  );
}