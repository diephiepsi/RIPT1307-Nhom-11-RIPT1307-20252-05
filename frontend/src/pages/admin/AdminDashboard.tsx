import React, { useEffect, useState } from "react";
import { Card, Col, Row, Statistic, Spin, message } from "antd";
import {
  UserOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CommentOutlined,
} from "@ant-design/icons";
import { api } from "../../services/api";

// Định nghĩa kiểu dữ liệu thống kê trả về từ Backend
interface StatsData {
  totalUsers: number;
  totalPosts: number;
  pendingPosts: number;
  totalComments: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
       
        const response = await api.get("/admin/stats");
        setStats(response.data);
      } catch (error) {
        message.error("Lỗi khi tải dữ liệu thống kê");
        console.error("Lỗi lấy thông kê:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);


  if (loading) {
    return (
      <Spin size="large" style={{ display: "block", margin: "100px auto" }} />
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f0f2f5",
        minHeight: "100vh",
      }}
    >
      <h2 style={{ marginBottom: "24px" }}>Bảng thống kê</h2>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
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
            bordered={false}
            style={{
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
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
            bordered={false}
            style={{
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
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
            bordered={false}
            style={{
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
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
};

export default AdminDashboard;
