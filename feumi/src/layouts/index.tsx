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
import { BellOutlined } from "@ant-design/icons";
import { Link, Outlet, useLocation, useNavigate } from "umi";
import { useState, useEffect } from "react";

import { api } from "../services/api"; // Đường dẫn đến file axios của bạn
import { storage } from "../services/storage"; // Đường dẫn đến file lưu token
import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";

const { Header, Content, Sider } = Layout;

// Kiểu dữ liệu thông báo
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

// Hook xác định đang ở trang nào để làm sáng thanh Menu bên trái
function useSelectedKey(pathname: string) {
  if (pathname.startsWith("/admin/users")) return "/admin/users";
  if (pathname.startsWith("/admin/posts")) return "/admin/posts";
  if (pathname.startsWith("/admin/dashboard")) return "/admin/dashboard";
  if (pathname.startsWith("/login")) return "/login";
  if (pathname.startsWith("/register")) return "/register";
  return "/";
}

export default function GlobalLayout() {
  const loc = useLocation();
  const nav = useNavigate();
  const selectedKey = useSelectedKey(loc.pathname);

  // Lấy user trực tiếp từ storage
  const user = storage.getUser();
  const token = storage.getToken();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // ============================================================
  // LOGIC LẤY THÔNG BÁO (GIỮ NGUYÊN TỪ CŨ)
  // ============================================================
  useEffect(() => {
    // Chỉ gọi API nếu đã đăng nhập
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

  // GIAO DIỆN CỦA HỘP THÔNG BÁO BẬT RA
  const notificationContent = (
    <div style={{ width: "340px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
          paddingBottom: "5px",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <span style={{ fontWeight: 600 }}>Thông báo</span>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            onClick={markAllAsRead}
            style={{ padding: 0, fontSize: "0.8rem" }}
          >
            Đánh dấu đã đọc
          </Button>
        )}
      </div>
      <List
        dataSource={notifications}
        itemLayout="horizontal"
        locale={{ emptyText: "Bạn không có thông báo nào" }}
        renderItem={(item) => (
          <List.Item
            style={{
              padding: "8px 8px",
              backgroundColor: !item.isRead ? "#f4f8fa" : "transparent",
              borderRadius: "4px",
              cursor: "pointer",
              marginBottom: "4px",
              transition: "background-color 0.2s",
            }}
            onClick={() => {
              nav(`/questions/${item.targetId}`);
            }}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  size="small"
                  style={{
                    backgroundColor: !item.isRead ? "#0a95ff" : "#cbd5e1",
                  }}
                  icon={item.type === "LIKE" ? "❤️" : "💬"}
                />
              }
              title={
                <span
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: !item.isRead ? 600 : 400,
                    color: "#232629",
                  }}
                >
                  {item.content}
                </span>
              }
              description={
                <span style={{ fontSize: "0.7rem", color: "#9199a1" }}>
                  {formatTime(item.createdAt)}
                </span>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

  // MENU BÊN TRÁI
  const sidebarItems = [
    { key: "/", label: <Link to="/">Câu hỏi</Link> },
    { key: "/ask", label: <Link to="/ask">Đặt câu hỏi</Link> },
  ];

  if (user?.role === "ADMIN") {
    sidebarItems.push(
      {
        key: "/admin/posts",
        label: <Link to="/admin/posts">⚙️ Quản trị bài</Link>,
      },
      {
        key: "/admin/users",
        label: <Link to="/admin/users">⚙️ Quản trị user</Link>,
      },
      {
        key: "/admin/dashboard",
        label: <Link to="/admin/dashboard">📊 Thống kê</Link>,
      },
    );
  }

  const isAuthPage = selectedKey === "/login" || selectedKey === "/register";

  // Nếu đang ở trang Đăng nhập / Đăng ký thì không hiện Header và Menu bên trái
  if (isAuthPage) {
    return <Outlet />;
  }

  return (
    <>
      <Layout style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
        {/* --- HEADER --- */}
        <Header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1000,
            width: "100%",
            height: "50px",
            lineHeight: "50px",
            backgroundColor: "#ffffff",
            borderTop: "3px solid #f48225",
            borderBottom: "1px solid #e3e6e8",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          <Space size="large" style={{ flex: 1, maxWidth: "800px" }}>
            <Typography.Title
              level={4}
              onClick={() => nav("/")}
              style={{
                color: "#0c0d0e",
                margin: 0,
                cursor: "pointer",
                fontFamily: "sans-serif",
                fontSize: "1.3rem",
              }}
            >
              UniBrain
              <span style={{ fontWeight: 300, color: "#f48225" }}>.com</span>
            </Typography.Title>
          </Space>

          <Space size="middle">
            {token && user ? (
              <>
                {/* CÁI CHUÔNG ĐÂY RỒI! */}
                <Popover
                  content={notificationContent}
                  trigger="click"
                  placement="bottomRight"
                  arrow={{ pointAtCenter: true }}
                >
                  <Badge
                    count={unreadCount}
                    size="small"
                    offset={[-2, 4]}
                    style={{ backgroundColor: "#f48225" }}
                  >
                    <Button
                      type="text"
                      icon={
                        <BellOutlined
                          style={{ fontSize: "1.2rem", color: "#525960" }}
                        />
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "4px",
                      }}
                    />
                  </Badge>
                </Popover>

                <Typography.Text
                  style={{ color: "#232629", fontSize: "0.85rem" }}
                >
                  {user.fullName || "Người dùng"} (
                  <span style={{ color: "#0074cc", fontWeight: "bold" }}>
                    {user.role}
                  </span>
                  )
                </Typography.Text>

                <Button
                  size="small"
                  style={{
                    backgroundColor: "#f48225",
                    color: "#fff",
                    border: "none",
                    borderRadius: "3px",
                    fontSize: "0.8rem",
                  }}
                  onClick={() => {
                    storage.clearToken();
                    storage.clearUser();
                    window.location.href = "/login"; // Ép tải lại trang để xóa sạch cache
                  }}
                >
                  Đăng xuất
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="small"
                  style={{
                    backgroundColor: "#e1ecf4",
                    color: "#39739d",
                    borderColor: "#7aa7c7",
                    borderRadius: "3px",
                  }}
                  onClick={() => nav("/login")}
                >
                  Đăng nhập
                </Button>
                <Button
                  type="primary"
                  size="small"
                  style={{
                    backgroundColor: "#0a95ff",
                    borderColor: "transparent",
                    borderRadius: "3px",
                  }}
                  onClick={() => nav("/register")}
                >
                  Đăng ký
                </Button>
              </>
            )}
          </Space>
        </Header>

        {/* --- THÂN TRANG VÀ SIDEBAR --- */}
        <Layout
          style={{
            maxWidth: "1264px",
            width: "100%",
            margin: "0 auto",
            background: "transparent",
          }}
        >
          <Sider
            width={170}
            theme="light"
            style={{
              background: "transparent",
              borderRight: "1px solid #e3e6e8",
              height: "calc(100vh - 50px)",
              position: "sticky",
              top: "50px",
              paddingTop: "16px",
            }}
          >
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              items={sidebarItems}
              style={{ background: "transparent", borderRight: "none" }}
            />
          </Sider>

          <Content
            style={{
              padding: "24px",
              backgroundColor: "#ffffff",
              minHeight: "calc(100vh - 50px)",
              flex: 1,
            }}
          >
            <Outlet />{" "}
            {/* Nơi các trang con như /ask, /questions sẽ hiển thị */}
          </Content>
        </Layout>
      </Layout>
      <ConfigProvider locale={viVN}>
        <Layout style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
          {/* ... Toàn bộ Header, Sider, Content của bạn giữ nguyên bên trong này ... */}
        </Layout>
      </ConfigProvider>
    </>
  );
}
