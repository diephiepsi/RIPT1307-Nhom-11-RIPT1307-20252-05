import {
  Layout,
  Menu,
  Space,
  Typography,
  Popover,
  Badge,
  List,
  Avatar,
  Button,
} from "antd";
import {
  BellOutlined,
  HomeOutlined,
  PlusCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useLocation, useNavigate } from "umi";
import { useState, useEffect } from "react";
import { api } from "../services/api";
import { storage } from "../services/storage";

const { Header, Content, Sider } = Layout;

interface NotificationItem {
  id: string;
  recipientId: string;
  senderId: string;
  type: "LIKE" | "COMMENT" | string;
  content: string;
  targetId: string;
  isRead: boolean;
  createdAt: string;
}

function useSelectedKey(pathname: string) {
  if (pathname.startsWith("/admin/users")) return "/admin/users";
  if (pathname.startsWith("/admin/posts")) return "/admin/posts";
  if (pathname.startsWith("/ask")) return "/ask";
  if (pathname.startsWith("/login")) return "/login";
  if (pathname.startsWith("/register")) return "/register";
  return "/";
}

export default function GlobalLayout() {
  const loc = useLocation();
  const nav = useNavigate();
  const selectedKey = useSelectedKey(loc.pathname);

  const user = storage.getUser();
  const token = storage.getToken();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        const { data } = await api.get<NotificationItem[]>("/notifications");
        setNotifications(data);
      } catch (error) {
        console.error("Lỗi khi tải thông báo:", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = async () => {
    try {
      if (!token) return;
      await api.post("/notifications/read-all");
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? ""
      : d.toLocaleDateString("vi-VN") +
          " " +
          d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  // UI Component: Danh sách thông báo được thiết kế lại gọn gàng hơn
  const notificationContent = (
    <div style={{ width: 340 }}>
      <div className="notification-header">
        <Typography.Text strong style={{ fontSize: 16 }}>
          Thông báo
        </Typography.Text>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            onClick={markAllAsRead}
            className="btn-mark-read"
          >
            Đánh dấu đã đọc
          </Button>
        )}
      </div>
      <List
        dataSource={notifications}
        itemLayout="horizontal"
        locale={{ emptyText: "Không có thông báo mới" }}
        className="notification-list"
        renderItem={(item) => (
          <List.Item
            className={`notification-item ${!item.isRead ? "unread" : "read"}`}
            onClick={() => nav(`/questions/${item.targetId}`)}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  size={40}
                  className={`notification-avatar ${item.type.toLowerCase()}`}
                  icon={item.type === "LIKE" ? "❤️" : "💬"}
                />
              }
              title={<span className="notification-title">{item.content}</span>}
              description={
                <span className="notification-time">
                  {formatTime(item.createdAt)}
                </span>
              }
            />
            {!item.isRead && <div className="unread-dot" />}
          </List.Item>
        )}
      />
    </div>
  );

  const sidebarItems = [
    {
      key: "/",
      icon: <HomeOutlined />,
      label: <Link to="/">Trang chủ</Link>,
    },
    {
      key: "/ask",
      icon: <PlusCircleOutlined />,
      label: <Link to="/ask">Đặt câu hỏi</Link>,
    },
  ];

  if (user?.role === "ADMIN") {
    sidebarItems.push(
      {
        key: "/admin/posts",
        icon: <FileTextOutlined />,
        label: <Link to="/admin/posts">Quản lý bài viết</Link>,
      },
      {
        key: "/admin/users",
        icon: <TeamOutlined />,
        label: <Link to="/admin/users">Quản lý người dùng</Link>,
      },
    );
  }

  const isAuthPage = selectedKey === "/login" || selectedKey === "/register";

  if (isAuthPage) {
    return <Outlet />;
  }

  return (
    <>
      {/* Đưa CSS cấu trúc vào class chuyên biệt thay vì dùng Inline */}
      <style>{`
        :root {
          --brand-primary: #f97316;
          --brand-primary-light: #fff7ed;
          --border-color: #e2e8f0;
          --text-main: #0f172a;
          --text-muted: #64748b;
          --bg-main: #f8fafc;
        }
        
        body {
          background-color: var(--bg-main);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          margin: 0;
        }

        /* Tùy chỉnh Layout */
        .admin-header {
          position: sticky;
          top: 0;
          z-index: 1000;
          width: 100%;
          height: 64px;
          background: #ffffff;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
        }

        .brand-logo {
          margin: 0 !important;
          cursor: pointer;
          font-size: 1.5rem !important;
          font-weight: 800 !important;
          color: var(--text-main) !important;
        }

        .brand-accent {
          color: var(--brand-primary);
        }

        /* Nút & Avatar Header */
        .user-profile-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 4px 12px 4px 4px;
          border-radius: 30px;
          border: 1px solid transparent;
          transition: background 0.2s;
          cursor: pointer;
        }

        .user-profile-badge:hover {
          background: var(--bg-main);
          border-color: var(--border-color);
        }

        /* Sidebar hiện đại */
        .app-sidebar {
          background: #ffffff !important;
          border-right: 1px solid var(--border-color) !important;
          height: calc(100vh - 64px);
          position: sticky !important;
          top: 64px;
        }

        .custom-menu {
          border-right: none !important;
          padding: 16px 8px;
        }

        .custom-menu .ant-menu-item {
          border-radius: 8px !important;
          margin-bottom: 4px !important;
          height: 44px !important;
          line-height: 44px !important;
          font-weight: 500;
          color: var(--text-muted);
        }

        .custom-menu .ant-menu-item-selected {
          background-color: var(--brand-primary-light) !important;
          color: var(--brand-primary) !important;
          font-weight: 600;
        }

        .custom-menu .ant-menu-item-selected .anticon {
          color: var(--brand-primary) !important;
        }

        /* Main Content Container */
        .main-content-wrapper {
          padding: 32px;
          min-height: calc(100vh - 64px);
        }

        .content-card {
          background-color: #ffffff;
          border-radius: 12px;
          padding: 32px;
          min-height: 100%;
          border: 1px solid var(--border-color);
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        /* CSS Cho Thông Báo (Pop-over) */
        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-color);
        }

        .btn-mark-read {
          color: var(--text-muted);
          font-size: 13px;
        }
        
        .btn-mark-read:hover {
          color: var(--brand-primary) !important;
        }

        .notification-list {
          max-height: 350px;
          overflow-y: auto;
        }

        .notification-item {
          padding: 12px !important;
          border-radius: 8px;
          cursor: pointer;
          border: none !important;
          transition: background 0.2s;
          position: relative;
        }

        .notification-item:hover {
          background-color: var(--bg-main);
        }

        .notification-item.unread {
          background-color: var(--brand-primary-light);
        }

        .notification-item.unread:hover {
          background-color: #ffedd5;
        }

        .notification-avatar {
          background-color: #f1f5f9;
          font-size: 16px;
        }

        .notification-title {
          font-size: 14px;
          color: var(--text-main);
          font-weight: 500;
        }
        
        .notification-item.unread .notification-title {
          font-weight: 600;
        }

        .notification-time {
          font-size: 12px;
          color: var(--text-muted);
          display: block;
          margin-top: 4px;
        }

        .unread-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--brand-primary);
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
        }
      `}</style>

      <Layout style={{ minHeight: "100vh" }}>
        {/* Phần Header được làm phẳng và thanh lịch */}
        <Header className="admin-header">
          <Space size="large" style={{ flex: 1 }}>
            <Typography.Title
              level={4}
              onClick={() => nav("/")}
              className="brand-logo"
            >
              UniBrain<span className="brand-accent">.com</span>
            </Typography.Title>
          </Space>

          <Space size="middle" align="center">
            {token && user ? (
              <>
                <Popover
                  content={notificationContent}
                  trigger="click"
                  placement="bottomRight"
                  overlayInnerStyle={{
                    padding: "16px 16px 8px 16px",
                    borderRadius: 12,
                  }}
                >
                  <Badge
                    count={unreadCount}
                    size="small"
                    style={{ backgroundColor: "#f97316" }}
                  >
                    <Button
                      type="text"
                      icon={
                        <BellOutlined
                          style={{ fontSize: 20, color: "#64748b" }}
                        />
                      }
                      shape="circle"
                      size="large"
                    />
                  </Badge>
                </Popover>

                <div className="user-profile-badge">
                  <Avatar
                    style={{ backgroundColor: "#f97316", fontWeight: "bold" }}
                  >
                    {user.fullName?.[0]?.toUpperCase() || "U"}
                  </Avatar>
                  <div style={{ lineHeight: 1.2 }}>
                    <Typography.Text
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        display: "block",
                      }}
                    >
                      {user.fullName || "Người dùng"}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {user.role === "ADMIN" ? "Quản trị viên" : "Thành viên"}
                    </Typography.Text>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    storage.clearToken();
                    storage.clearUser();
                    window.location.href = "/login";
                  }}
                >
                  Đăng xuất
                </Button>
              </>
            ) : (
              <>
                <Button type="text" onClick={() => nav("/login")}>
                  Đăng nhập
                </Button>
                <Button
                  type="primary"
                  style={{ backgroundColor: "#0f172a", borderRadius: 6 }}
                  onClick={() => nav("/register")}
                >
                  Đăng ký
                </Button>
              </>
            )}
          </Space>
        </Header>

        <Layout>
          <Sider width={250} className="app-sidebar">
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              items={sidebarItems}
              className="custom-menu"
            />
          </Sider>

          <Content className="main-content-wrapper">
            <div className="content-card">
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
    </>
  );
}
