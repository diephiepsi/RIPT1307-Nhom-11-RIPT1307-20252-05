import {
  App,
  Button,
  Descriptions,
  Drawer,
  Dropdown,
  Space,
  Tag,
  Typography,
  Card,
  Badge,
} from "antd";
import type { MenuProps } from "antd";
import {
  MoreOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  FireFilled,
} from "@ant-design/icons";
import { useState, useRef } from "react";
import { ProTable } from "@ant-design/pro-components";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import { adminService } from "../../services/admin";

// --- TYPE DEFINITIONS ---
type AdminPostRow = {
  id: string;
  title: string;
  authorName: string;
  createdAt: string;
  score: number;
  isApproved: boolean;
  tags: string[];
  content: string;
};

const { Title, Text, Paragraph } = Typography;

// --- ENUMS ---
const STATUS_ENUM = {
  true: { text: "Đã duyệt", status: "Success" },
  false: { text: "Chờ xử lý", status: "Warning" },
};

export default function AdminPostsPage() {
  const { message, modal } = App.useApp();
  const [viewing, setViewing] = useState<AdminPostRow | null>(null);
  const actionRef = useRef<ActionType>();

  // --- BỐ CỤC CỘT DỮ LIỆU ---
  const columns: ProColumns<AdminPostRow>[] = [
    {
      title: "Tiêu đề bài viết",
      dataIndex: "title",
      copyable: true,
      width: "28%",
      render: (_, row) => (
        <Text
          strong
          ellipsis={{ tooltip: row.title }}
          style={{ fontSize: 15, color: "#0f172a" }}
        >
          {row.title}
        </Text>
      ),
    },
    {
      title: "Tác giả",
      dataIndex: "authorName",
      width: "15%",
      render: (_, row) => (
        <Text style={{ fontWeight: 500, color: "#475569" }}>
          {row.authorName}
        </Text>
      ),
    },
    {
      title: "Tương tác",
      dataIndex: "score",
      width: "10%",
      search: false,
      render: (_, row) => (
        <Space
          size={6}
          style={{
            background: "#fef2f2",
            padding: "4px 10px",
            borderRadius: 20,
            border: "1px solid #fee2e2",
          }}
        >
          <FireFilled style={{ color: "#ef4444", fontSize: 14 }} />
          <Text strong style={{ color: "#b91c1c" }}>
            {row.score}
          </Text>
        </Space>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      valueType: "date", // Đổi thành date để UI gọn hơn, chỉ hiện ngày tháng
      width: "12%",
      search: false,
      render: (_, row) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {new Date(row.createdAt).toLocaleDateString("vi-VN")}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isApproved",
      width: "15%",
      valueType: "select",
      valueEnum: STATUS_ENUM,
      render: (_, row) => (
        <Badge
          status={row.isApproved ? "success" : "warning"}
          text={
            <Text
              style={{
                fontWeight: 600,
                color: row.isApproved ? "#059669" : "#d97706",
              }}
            >
              {row.isApproved ? "Đã duyệt" : "Chờ xử lý"}
            </Text>
          }
        />
      ),
    },
    {
      title: "Chủ đề (Tags)",
      dataIndex: "tags",
      width: "15%",
      search: false,
      render: (_, row) => (
        <Space size={[4, 8]} wrap>
          {row.tags?.slice(0, 2).map((t) => (
            <Tag
              key={t}
              style={{
                margin: 0,
                borderRadius: 12,
                background: "#f1f5f9",
                color: "#334155",
                border: "none",
                fontWeight: 500,
              }}
            >
              {t}
            </Tag>
          ))}
          {row.tags?.length > 2 && (
            <Tag style={{ margin: 0, borderRadius: 12, border: "none" }}>
              +{row.tags.length - 2}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      align: "center",
      width: "8%",
      search: false,
      render: (_, row) => {
        const menuItems: MenuProps["items"] = [
          {
            key: "view",
            icon: <EyeOutlined style={{ color: "#3b82f6" }} />,
            label: (
              <Text strong style={{ color: "#334155" }}>
                Xem chi tiết
              </Text>
            ),
            onClick: () => setViewing(row),
          },
        ];

        if (!row.isApproved) {
          menuItems.push({
            key: "approve",
            icon: <CheckCircleOutlined style={{ color: "#10b981" }} />,
            label: (
              <Text strong style={{ color: "#10b981" }}>
                Duyệt bài viết
              </Text>
            ),
            onClick: async () => {
              try {
                await adminService.approvePost(row.id);
                message.success("Đã duyệt bài viết thành công!");
                actionRef.current?.reload();
              } catch {
                message.error("Duyệt bài thất bại, vui lòng thử lại.");
              }
            },
          });
        }

        menuItems.push(
          { type: "divider" },
          {
            key: "delete",
            icon: <DeleteOutlined />,
            label: "Xóa bài viết",
            danger: true,
            onClick: () => {
              modal.confirm({
                title: "Xóa bài viết này?",
                content:
                  "Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa?",
                okText: "Xóa vĩnh viễn",
                okButtonProps: { danger: true, style: { borderRadius: 8 } },
                cancelButtonProps: { style: { borderRadius: 8 } },
                cancelText: "Hủy bỏ",
                centered: true,
                onOk: async () => {
                  try {
                    await adminService.deletePost(row.id);
                    message.success("Đã xóa bài viết khỏi hệ thống.");
                    actionRef.current?.reload();
                  } catch {
                    message.error("Xóa bài thất bại.");
                  }
                },
              });
            },
          },
        );

        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<MoreOutlined style={{ fontSize: 20, color: "#64748b" }} />}
              style={{ borderRadius: 8 }}
            />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div
      style={{
        padding: "32px",
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* Bao bọc Table bằng một div có bo góc và đổ bóng mượt mà */}
      <div
        style={{
          borderRadius: 20,
          overflow: "hidden",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05)",
          background: "#fff",
        }}
      >
        <ProTable<AdminPostRow>
          headerTitle={
            <div style={{ padding: "8px 0" }}>
              <Title
                level={3}
                style={{
                  margin: 0,
                  fontWeight: 700,
                  color: "#0f172a",
                  letterSpacing: "-0.02em",
                }}
              >
                Quản trị Nội dung
              </Title>
              <Text style={{ fontSize: 14, color: "#64748b" }}>
                Kiểm duyệt và quản lý các bài đăng từ cộng đồng.
              </Text>
            </div>
          }
          actionRef={actionRef}
          rowKey="id"
          columns={columns}
          cardBordered={false} // Tắt border mặc định thô cứng của ProTable
          request={async () => {
            try {
              const { data } = await adminService.getPosts();
              return { data, success: true };
            } catch (err) {
              message.error("Không tải được danh sách bài viết");
              return { data: [], success: false };
            }
          }}
          search={{
            labelWidth: "auto",
            collapsed: false,
            span: 8, // Chia form search thành 3 cột đều nhau
          }}
          options={{
            setting: { listsHeight: 400 },
            density: false,
            fullScreen: true,
            reload: true,
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            style: {
              padding: "16px 24px",
              margin: 0,
              borderTop: "1px solid #f1f5f9",
            },
          }}
          rowClassName={() => "custom-table-row"}
        />
      </div>

      <Drawer
        title={
          <Text strong style={{ fontSize: 20, color: "#0f172a" }}>
            Chi tiết bài viết
          </Text>
        }
        width={800} // Mở rộng thêm một chút cho dễ đọc
        onClose={() => setViewing(null)}
        open={!!viewing}
        bodyStyle={{ padding: "32px 40px", backgroundColor: "#f8fafc" }}
        headerStyle={{ borderBottom: "none", padding: "24px 40px 0" }}
        closeIcon={
          <div
            style={{
              background: "#f1f5f9",
              padding: 8,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </div>
        }
      >
        {viewing && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Header Drawer */}
            <div>
              <Space size={[0, 8]} wrap style={{ marginBottom: 16 }}>
                {viewing.tags.map((tag) => (
                  <Tag
                    key={tag}
                    style={{
                      borderRadius: 20,
                      background: "#e0e7ff",
                      color: "#4338ca",
                      border: "none",
                      padding: "2px 12px",
                      fontWeight: 600,
                    }}
                  >
                    #{tag}
                  </Tag>
                ))}
              </Space>
              <Title
                level={2}
                style={{
                  margin: 0,
                  fontWeight: 800,
                  color: "#0f172a",
                  lineHeight: 1.3,
                }}
              >
                {viewing.title}
              </Title>
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  color: "#64748b",
                }}
              >
                <Text strong style={{ color: "#334155" }}>
                  👤 {viewing.authorName}
                </Text>
                <span>•</span>
                <Text>
                  🕒 {new Date(viewing.createdAt).toLocaleString("vi-VN")}
                </Text>
                <span>•</span>
                <Text strong style={{ color: "#ef4444" }}>
                  <FireFilled /> {viewing.score} điểm
                </Text>
              </div>
            </div>

            {/* Nội dung bài viết */}
            <Card
              bordered={false}
              style={{
                borderRadius: 16,
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
              }}
              bodyStyle={{ padding: "32px" }}
            >
              <Paragraph
                style={{
                  whiteSpace: "pre-wrap",
                  marginBottom: 0,
                  fontSize: 16,
                  lineHeight: 1.8,
                  color: "#334155",
                }}
              >
                {viewing.content}
              </Paragraph>
            </Card>

            {/* Khung hành động trong Drawer */}
            {!viewing.isApproved && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 16,
                }}
              >
                <Button
                  type="primary"
                  size="large"
                  icon={<CheckCircleOutlined />}
                  style={{
                    borderRadius: 12,
                    backgroundColor: "#10b981",
                    boxShadow: "0 4px 14px 0 rgba(16, 185, 129, 0.39)",
                  }}
                  onClick={async () => {
                    await adminService.approvePost(viewing.id);
                    message.success("Đã duyệt!");
                    setViewing(null);
                    actionRef.current?.reload();
                  }}
                >
                  Phê duyệt bài viết này
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Thêm chút CSS toàn cục nhẹ cho Table hover state */}
      <style>{`
        .custom-table-row:hover > td {
          background-color: #f8fafc !important;
          transition: background-color 0.2s ease;
        }
        .ant-pro-table .ant-table-thead > tr > th {
          background-color: #ffffff;
          color: #64748b;
          font-weight: 600;
          border-bottom: 2px solid #f1f5f9;
        }
      `}</style>
    </div>
  );
}
