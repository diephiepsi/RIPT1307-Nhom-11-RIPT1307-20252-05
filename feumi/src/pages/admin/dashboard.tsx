import { useEffect, useState } from "react";
import { Card, Col, Row, Statistic, Spin, Typography, Alert } from "antd";
import { useNavigate } from "umi";
import {
  UserOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import { adminService } from "../../services/admin";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Định nghĩa kiểu dữ liệu thống kê trả về từ Backend
interface StatsData {
  totalUsers: number;
  totalStudents: number;
  totalLecturers: number;
  totalPosts: number;
  pendingPosts: number;
  totalComments: number;
  totalVisits: number;
  chartData: { date: string; count: number }[];
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
        <Col xs={24} sm={12} md={8}>
          <Card
            bordered
            hoverable
            onClick={() => navigate("/admin/users")}
            style={{ border: "1px solid #d9d9d9", cursor: "pointer" }}
          >
            <Statistic
              title={
                <span style={{ fontWeight: 500, fontSize: "16px" }}>
                  Tổng Sinh viên
                </span>
              }
              value={stats?.totalStudents || 0}
              prefix={
                <UserOutlined
                  style={{ color: "#fa8c16", marginRight: "8px" }}
                />
              }
              valueStyle={{ fontWeight: "bold" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card
            bordered
            hoverable
            onClick={() => navigate("/admin/users")}
            style={{ border: "1px solid #d9d9d9", cursor: "pointer" }}
          >
            <Statistic
              title={
                <span style={{ fontWeight: 500, fontSize: "16px" }}>
                  Tổng Giảng viên
                </span>
              }
              value={stats?.totalLecturers || 0}
              prefix={
                <SolutionOutlined
                  style={{ color: "#13c2c2", marginRight: "8px" }}
                />
              }
              valueStyle={{ fontWeight: "bold" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card bordered style={{ border: "1px solid #d9d9d9" }}>
            <Statistic
              title={
                <span style={{ fontWeight: 500, fontSize: "16px" }}>
                  Lượt truy cập
                </span>
              }
              value={stats?.totalVisits || 0}
              prefix={
                <EyeOutlined style={{ color: "#eb2f96", marginRight: "8px" }} />
              }
              valueStyle={{ fontWeight: "bold" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
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
                  style={{ color: "#1890ff", marginRight: "8px" }}
                />
              }
              valueStyle={{ fontWeight: "bold" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
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

        <Col xs={24} sm={12} md={8}>
          <Card
            bordered
            hoverable
            onClick={() => navigate("/admin/posts")}
            style={{ border: "1px solid #d9d9d9", cursor: "pointer" }}
          >
            <Statistic
              title={
                <span style={{ fontWeight: 500, fontSize: "16px" }}>
                  Bài viết đã duyệt
                </span>
              }
              value={(stats?.totalPosts || 0) - (stats?.pendingPosts || 0)}
              prefix={
                <CheckCircleOutlined
                  style={{ color: "#52c41a", marginRight: "8px" }}
                />
              }
              valueStyle={{ fontWeight: "bold" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card
            bordered
            title={
              <span style={{ fontWeight: 600, fontSize: "18px" }}>
                Biểu đồ số lượng bài đăng 7 ngày gần nhất
              </span>
            }
            style={{ border: "1px solid #d9d9d9", borderRadius: 12 }}
          >
            <ResponsiveContainer width="100%" height={350}>
              <LineChart
                data={stats?.chartData || []}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#64748b" }}
                  tickMargin={10}
                />
                <YAxis
                  tick={{ fill: "#64748b" }}
                  tickMargin={10}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 8 }}
                  name="Số bài đăng"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
