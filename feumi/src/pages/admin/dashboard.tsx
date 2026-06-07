import { useEffect, useState } from "react";
import { Card, Col, Row, Statistic, Spin, Typography, Alert } from "antd";
import { useNavigate } from "umi";
import {
  UserOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CommentOutlined,
} from "@ant-design/icons";
import { adminService } from "../../services/admin";

// Định nghĩa kiểu dữ liệu thống kê trả về từ Backend
interface StatsData {
  totalUsers: number;
  totalPosts: number;
  pendingPosts: number;
  totalComments: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      // Đảm bảo getStats tồn tại, nếu không ném lỗi thẳng ra màn hình
      if (!adminService || typeof adminService.getStats !== "function") {
        throw new Error(
          "Hàm getStats chưa được định nghĩa trong file services/admin.ts!",
        );
      }
      const res: any = await adminService.getStats();
      //  API trả về cục data, hoặc trả trực tiếp res
      setStats(res?.data ? res.data : res);
    } catch (error: any) {
      console.error("Lỗi Dashboard:", error);
      setErrorMsg(error.message || "Lỗi khi kết nối đến API thống kê");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (errorMsg) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Ứng dụng gặp lỗi"
          description={errorMsg}
          type="error"
          showIcon
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          padding: 24,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Typography.Title level={3} style={{ margin: 0 }}>
          Bảng thống kê
        </Typography.Title>
      </div>
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered
            hoverable
            onClick={() => navigate("/admin/users")}
            style={{ border: "1px solid #d9d9d9", cursor: "pointer" }}
          >
            <Statistic
              title={
                <span style={{ fontWeight: 500, fontSize: "16px" }}>
                  Tổng Người dùng
                </span>
              }
              value={stats?.totalUsers || 0}
              prefix={
                <UserOutlined
                  style={{ color: "#1890ff", marginRight: "8px" }}
                />
              }
              valueStyle={{ fontWeight: "bold" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card
            bordered
            hoverable
            onClick={() => navigate("/admin/posts")}
            style={{ border: "1px solid #d9d9d9", cursor: "pointer" }}
          >
            <Statistic
              title={
                <span style={{ fontWeight: 500, fontSize: "16px" }}>
                  Tổng Bài viết
                </span>
              }
              value={stats?.totalPosts || 0}
              prefix={
                <FileTextOutlined
                  style={{ color: "#52c41a", marginRight: "8px" }}
                />
              }
              valueStyle={{ fontWeight: "bold" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card
            bordered
            hoverable
            onClick={() => navigate("/admin/posts")}
            style={{ border: "1px solid #d9d9d9", cursor: "pointer" }}
          >
            <Statistic
              title={
                <span style={{ fontWeight: 500, fontSize: "16px" }}>
                  Bài viết chờ duyệt
                </span>
              }
              value={stats?.pendingPosts || 0}
              prefix={
                <ClockCircleOutlined
                  style={{ color: "#faad14", marginRight: "8px" }}
                />
              }
              valueStyle={{ fontWeight: "bold" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card
            bordered
            hoverable
            onClick={() => {
              alert("Chức năng quản lý bình luận độc lập đang được phát triển");
            }}
            style={{ border: "1px solid #d9d9d9", cursor: "pointer" }}
          >
            <Statistic
              title={
                <span style={{ fontWeight: 500, fontSize: "16px" }}>
                  Tổng Bình luận
                </span>
              }
              value={stats?.totalComments || 0}
              prefix={
                <CommentOutlined
                  style={{ color: "#722ed1", marginRight: "8px" }}
                />
              }
              valueStyle={{ fontWeight: "bold" }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
