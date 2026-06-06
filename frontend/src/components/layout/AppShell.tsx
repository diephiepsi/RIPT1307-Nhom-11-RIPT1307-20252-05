import { Button, Layout, Menu, Space, Typography, Input, Popover, Badge, List, Avatar } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/authSlice';
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Footer from './Footer';
import { storage } from '../../services/storage';

const { Header, Content, Sider } = Layout;

interface NotificationItem {
  id: string;
  recipientId: string;
  senderId: string;
  type: 'LIKE' | 'COMMENT' | string;
  content: string;
  targetId: string;
  isRead: boolean;
  createdAt: string;
}

function useSelectedKey() {
  const loc = useLocation();
  const p = loc.pathname;
  if (p.startsWith('/admin/users')) return '/admin/users';
  if (p.startsWith('/admin/posts')) return '/admin/posts';
  if (p.startsWith('/ask')) return '/ask';
  if (p.startsWith('/login')) return '/login';
  if (p.startsWith('/register')) return '/register';
  return '/';
}

export function AppShell() {
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const nav = useNavigate();
  const selectedKey = useSelectedKey();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // ============================================================
  // FETCH THÔNG BÁO TỰ ĐỘNG (BỔ SUNG TOKEN GUARD PHÒNG LỖI LOGOUT)
  // ============================================================
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const token = storage.getToken();
      if (!token) return; // Nếu đã logout hoặc mất token, chặn gọi API ngầm để tránh lỗi 401 Unauthorized

      try {
        const { data } = await api.get<NotificationItem[]>('/notifications');
        setNotifications(data);
      } catch (error) {
        console.error('Lỗi khi tải thông báo:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); 
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = async () => {
    try {
      const token = storage.getToken();
      if (!token) return;

      await api.post('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái đã đọc:', error);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const notificationContent = (
    <div style={{ width: '340px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '5px', borderBottom: '1px solid var(--color-border)' }}>
        <span style={{ fontWeight: 600 }}>Thông báo</span>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={markAllAsRead} style={{ padding: 0, fontSize: '0.8rem' }}>
            Đánh dấu đã đọc
          </Button>
        )}
      </div>
      <List
        dataSource={notifications}
        itemLayout="horizontal"
        locale={{ emptyText: 'Bạn không có thông báo nào' }}
        renderItem={(item) => (
          <List.Item 
            style={{ 
              padding: '8px 8px', 
              backgroundColor: !item.isRead ? 'rgba(10,149,255,0.06)' : 'transparent',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '4px',
              transition: 'background-color 0.2s'
            }}
            onClick={() => {
              // CHÚ Ý: Sửa lại path này (/questions hoặc /posts) cho khớp chính xác với Router Front-end của bạn
              nav(`/questions/${item.targetId}`);
            }}
          >
            <List.Item.Meta
              avatar={
                <Avatar 
                  size="small" 
                  style={{ backgroundColor: !item.isRead ? 'var(--color-accent)' : 'var(--color-border)' }}
                  icon={item.type === 'LIKE' ? '❤️' : '💬'} 
                />
              }
              title={
                <span style={{ fontSize: '0.82rem', fontWeight: !item.isRead ? 600 : 400, color: 'var(--color-text)' }}>
                  {item.content}
                </span>
              }
              description={
                <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>
                  {formatTime(item.createdAt)}
                </span>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

  const sidebarItems = [
    { key: '/', label: <Link to="/">Câu hỏi</Link> },
    { key: '/ask', label: <Link to="/ask">Đặt câu hỏi</Link> },
  ];

  if (user?.role === 'ADMIN') {
    sidebarItems.push(
      { key: '/admin/posts', label: <Link to="/admin/posts">⚙️ Quản trị bài</Link> },
      { key: '/admin/users', label: <Link to="/admin/users">⚙️ Quản trị user</Link> },
    );
  }

  const isAuthPage = selectedKey === '/login' || selectedKey === '/register';

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      
      {/* --- HEADER --- */}
      <Header style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        width: '100%',
        height: '50px',
        lineHeight: '50px',
        backgroundColor: 'var(--color-surface)',
        borderTop: '3px solid var(--color-accent)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}>
        <Space size="large" style={{ flex: 1, maxWidth: '800px' }}>
          <Typography.Title 
            level={4} 
            onClick={() => nav('/')}
            style={{ color: 'var(--color-text)', margin: 0, cursor: 'pointer', fontFamily: 'sans-serif', fontSize: '1.3rem' }}
          >
            UniBrain<span style={{ fontWeight: 300, color: 'var(--color-accent)' }}>.com</span>
          </Typography.Title>
        </Space>

        <Space size="middle">
          {user ? (
            <>
              {/* --- NÚT CHUÔNG THÔNG BÁO --- */}
              <Popover 
                content={notificationContent} 
                trigger="click" 
                placement="bottomRight"
                arrow={{ pointAtCenter: true }}
              >
                <Badge count={unreadCount} size="small" offset={[-2, 4]} style={{ backgroundColor: 'var(--color-accent)' }}>
                  <Button 
                    type="text" 
                    icon={<BellOutlined style={{ fontSize: '1.2rem', color: 'var(--color-muted)' }} />} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      padding: '4px'
                    }} 
                  />
                </Badge>
              </Popover>

              <Typography.Text style={{ color: 'var(--color-text)', fontSize: '0.85rem' }}>
                {user.fullName} (<span style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>{user.role}</span>)
              </Typography.Text>
              
              <Button
                size="small"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '0.8rem'
                }}
                onClick={() => {
                  localStorage.removeItem('token'); 
                  dispatch(logout());
                  nav('/login');
                }}
              >
                Đăng xuất
              </Button>
            </>
          ) : (
            <>
              <Button 
                size="small"
                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-accent)', borderColor: 'var(--color-border)', borderRadius: '3px' }} 
                onClick={() => nav('/login')}
              >
                Đăng nhập
              </Button>
              <Button 
                type="primary" 
                size="small"
                style={{ backgroundColor: 'var(--color-accent)', borderColor: 'transparent', borderRadius: '3px' }} 
                onClick={() => nav('/register')}
              >
                Đăng ký
              </Button>
            </>
          )}
        </Space>
      </Header>

      {/* --- THÂN TRANG --- */}
      <Layout style={{ maxWidth: '1264px', width: '100%', margin: '0 auto', background: 'transparent' }}>
        {!isAuthPage && (
          <Sider
            width={170}
            theme="light"
            style={{
              background: 'transparent',
              borderRight: '1px solid var(--color-border)',
              height: 'calc(100vh - 50px)',
              position: 'sticky',
              top: '50px',
              paddingTop: '16px'
            }}
          >
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              items={sidebarItems}
              style={{ background: 'transparent', borderRight: 'none' }}
              className="so-sidebar-menu"
            />
          </Sider>
        )}

        <Content style={{ padding: '24px', backgroundColor: 'var(--color-surface)', minHeight: 'calc(100vh - 50px)', flex: 1 }}>
          <Outlet />
        </Content>
        </Layout>
        <Footer />
    </Layout>
  );
}