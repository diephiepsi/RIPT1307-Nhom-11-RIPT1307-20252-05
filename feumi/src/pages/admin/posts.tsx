import { App, Button, Descriptions, Modal, Space, Tag, Typography } from "antd";
import { useState, useRef } from "react";
import { ProTable } from "@ant-design/pro-components";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import { adminService } from "../../services/admin";

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

export default function AdminPostsPage() {
  const { message, modal } = App.useApp();
  const [viewing, setViewing] = useState<AdminPostRow | null>(null);
  const actionRef = useRef<ActionType>();

  const columns: ProColumns<AdminPostRow>[] = [
    { title: "Tiêu đề", dataIndex: "title", copyable: true },
    { title: "Tác giả", dataIndex: "authorName" },
    { title: "Điểm", dataIndex: "score" },
    {
      title: "Ngày",
      dataIndex: "createdAt",
      valueType: "dateTime",
    },
    {
      title: "Trạng thái",
      dataIndex: "isApproved",
      render: (_, row) => (
        <Tag color={row.isApproved ? "green" : "orange"}>
          {row.isApproved ? "Đã duyệt" : "Chờ duyệt"}
        </Tag>
      ),
    },
    {
      title: "Thẻ",
      dataIndex: "tags",
      render: (_, row) => (
        <>
          {row.tags?.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, row) => (
        <Space>
          <Button onClick={() => setViewing(row)}>Xem</Button>
          {!row.isApproved && (
            <Button
              type="primary"
              onClick={async () => {
                try {
                  await adminService.approvePost(row.id);
                  message.success("Đã duyệt bài viết");
                  actionRef.current?.reload();
                } catch {
                  message.error("Duyệt bài thất bại");
                }
              }}
            >
              Duyệt
            </Button>
          )}
          <Button
            danger
            onClick={() => {
              modal.confirm({
                title: "Xóa bài viết?",
                content: "Thao tác không thể hoàn tác",
                onOk: async () => {
                  try {
                    await adminService.deletePost(row.id);
                    message.success("Đã xóa bài viết");
                    actionRef.current?.reload();
                  } catch {
                    message.error("Xóa bài thất bại");
                  }
                },
              });
            }}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={3}>Quản trị bài đăng</Typography.Title>

      <ProTable<AdminPostRow>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          try {
            const { data } = await adminService.getPosts();
            return { data, success: true };
          } catch (err) {
            message.error("Không tải được danh sách bài");
            return { data: [], success: false };
          }
        }}
        search={false}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Chi tiết bài viết"
        open={!!viewing}
        onCancel={() => setViewing(null)}
        footer={<Button onClick={() => setViewing(null)}>Đóng</Button>}
        width={800}
      >
        {viewing && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Tiêu đề">
              {viewing.title}
            </Descriptions.Item>
            <Descriptions.Item label="Tác giả">
              {viewing.authorName}
            </Descriptions.Item>
            <Descriptions.Item label="Thẻ">
              {/* Sử dụng optional chaining (?.) để tránh crash khi bài viết không có thẻ tag */}
              {viewing.tags?.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Descriptions.Item>
            <Descriptions.Item label="Nội dung">
              {/* Thêm div hiển thị xuống dòng pre-wrap và thanh cuộn nếu nội dung quá dài */}
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  maxHeight: "400px",
                  overflowY: "auto",
                }}
              >
                {viewing.content}
              </div>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
