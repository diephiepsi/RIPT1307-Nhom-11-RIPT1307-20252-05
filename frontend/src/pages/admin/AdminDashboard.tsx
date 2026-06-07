import React, { useEffect, useState } from "react";
import { Card, Col, Row, Statistic, Spin, message, Typography } from "antd";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

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
      <div
        className="ub-container"
        style={{
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
    <div className="ub-container">
      {/* Tiêu đề được cập nhật lại theo định dạng Typography của Ant Design, đồng bộ với các trang Admin khác */}
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
            className="ub-card"
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
            className="ub-card"
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
            className="ub-card"
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
            className="ub-card"
            bordered
            hoverable
            
            onClick={() =>
              message.info(
                "Chức năng quản lý bình luận độc lập đang được phát triển",
              )
            }
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
};

export default AdminDashboard;
