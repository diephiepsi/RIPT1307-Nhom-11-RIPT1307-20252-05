import { App, Button, Card, Form, Input, Radio, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { register } from '../../store/authSlice';
import { useAppDispatch } from '../../store/hooks';

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const nav = useNavigate();
  const { message } = App.useApp();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 150px)', // Giữ vị trí cân bằng giữa màn hình
      backgroundColor: '#f8f9fa',
      fontFamily: 'sans-serif',
      padding: '20px 0'
    }}>
      
      {/* LOGO THƯƠNG HIỆU */}
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
  UniBrain<span style={{ color: '#f48225', fontWeight: 300 }}>.com</span>
</div>

      {/* KHỐI BOX ĐĂNG KÝ (CARD) */}
      <Card 
        style={{ 
          width: '100%',
          maxWidth: '360px', // Rộng hơn trang Login một chút để chứa vừa form thông tin
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05), 0 5px 10px rgba(0, 0, 0, 0.03)',
          borderRadius: '7px',
          border: '1px solid #e3e6e8',
          backgroundColor: '#ffffff'
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <Form
          layout="vertical"
          requiredMark={false} // Ẩn dấu hoa thị đỏ (*) rối mắt
          initialValues={{ role: 'STUDENT' }}
          onFinish={async (values) => {
            try {
              await dispatch(register(values)).unwrap();
              message.success('Đăng ký thành công');
              nav('/');
            } catch {
              message.error('Đăng ký thất bại');
            }
          }}
        >
          {/* Ô nhập Họ tên */}
          <Form.Item 
            name="fullName" 
            label={<span style={{ fontWeight: 600, color: '#0c0d0e', fontSize: '0.9rem' }}>Display name</span>}
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
            style={{ marginBottom: '16px' }}
          >
            <Input style={{ borderRadius: '3px', padding: '8px' }} />
          </Form.Item>

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
            label={<span style={{ fontWeight: 600, color: '#0c0d0e', fontSize: '0.9rem' }}>Password</span>}
            rules={[{ required: true, message: 'Mật khẩu tối thiểu 6 ký tự', min: 6 }]}
            style={{ marginBottom: '16px' }}
          >
            <Input.Password style={{ borderRadius: '3px', padding: '8px' }} />
          </Form.Item>

          {/* Ô chọn Vai trò */}
          <Form.Item 
            name="role" 
            label={<span style={{ fontWeight: 600, color: '#0c0d0e', fontSize: '0.9rem' }}>I am a</span>}
            rules={[{ required: true }]}
            style={{ marginBottom: '24px' }}
          >
            <Radio.Group
              options={[
                { label: 'Sinh viên', value: 'STUDENT' },
                { label: 'Giảng viên', value: 'LECTURER' },
              ]}
              optionType="button" // Biến Radio thành dạng khối nút bấm phẳng nằm ngang cực đẹp
              buttonStyle="solid"
              style={{ width: '100%', display: 'flex' }}
            />
          </Form.Item>

          {/* Nút Đăng ký */}
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
            Sign up
          </Button>
        </Form>
      </Card>

      {/* DÒNG ĐIỀU HƯỚNG PHỤ QUAY LẠI LOGIN */}
      <div style={{ marginTop: '24px', fontSize: '0.85rem', color: '#232629' }}>
        Already have an account?{' '}
        <span 
          onClick={() => nav('/login')} 
          style={{ color: '#0074cc', cursor: 'pointer' }}
        >
          Log in
        </span>
      </div>

    </div>
  );
}