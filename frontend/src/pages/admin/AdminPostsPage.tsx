import { App, Button, Space, Table, Typography, Tag, Modal, Descriptions } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../services/api';

type AdminPostRow = {
  id: string;
  title: string;
  content: string; // MỚI THÊM: Nội dung bài viết
  tags: string[]; // MỚI THÊM: Danh sách Tag
  createdAt: string;
  authorName: string;
  score: number;
  isApproved: boolean;
};

export function AdminPostsPage() {
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AdminPostRow[]>([]);
  
  // MỚI THÊM: State để quản lý bài viết đang được xem chi tiết
  const [viewingPost, setViewingPost] = useState<AdminPostRow | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getPosts();
      setRows(data);
    } catch {
      message.error('Không tải được danh sách bài');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const columns = useMemo(
    () => [
      { title: 'Tiêu đề', dataIndex: 'title' },
      { title: 'Tác giả', dataIndex: 'authorName' },
      {
        title: 'Trạng thái',
        render: (_: unknown, r: AdminPostRow) => (
          r.isApproved 
            ? <Tag color="green">Đã duyệt</Tag> 
            : <Tag color="orange">Chờ duyệt</Tag>
        ),
      },
      { title: 'Điểm', dataIndex: 'score' },
      { 
        title: 'Ngày đăng', 
        render: (_: unknown, r: AdminPostRow) => new Date(r.createdAt).toLocaleDateString('vi-VN') 
      },
      {
        title: 'Thao tác',
        render: (_: unknown, r: AdminPostRow) => (
          <Space>
            {/* MỚI THÊM: Nút Xem chi tiết */}
            <Button onClick={() => setViewingPost(r)}>
              Xem
            </Button>

            {/* Nút Duyệt bài */}
            {!r.isApproved && (
              <Button
                type="primary"
                onClick={async () => {
                  try {
                    await adminApi.approvePost(r.id);
                    message.success('Đã duyệt bài viết thành công!');
                    await load();
                  } catch {
                    message.error('Lỗi: Không thể duyệt bài viết lúc này.');
                  }
                }}
              >
                Duyệt
              </Button>
            )}

            {/* Nút Xóa bài */}
            <Button
              danger
              onClick={() => {
                modal.confirm({
                  title: 'Xóa bài?',
                  content: 'Thao tác này không thể hoàn tác.',
                  okText: 'Xóa',
                  cancelText: 'Hủy',
                  okButtonProps: { danger: true },
                  onOk: async () => {
                    try {
                      await adminApi.deletePost(r.id);
                      message.success('Đã xóa bài');
                      await load();
                    } catch {
                      message.error('Xóa bài thất bại');
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
    ],
    [message, modal],
  );

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Typography.Title level={3} style={{ margin: 0 }}>
        Quản trị bài đăng
      </Typography.Title>
      <Table rowKey="id" loading={loading} columns={columns} dataSource={rows} />

      {/* MỚI THÊM: Modal hiển thị chi tiết bài đăng */}
      <Modal
        title="Chi tiết bài đăng"
        open={!!viewingPost}
        onCancel={() => setViewingPost(null)}
        footer={<Button onClick={() => setViewingPost(null)}>Đóng</Button>}
        width={800} // Mở rộng kích thước Modal để dễ đọc nội dung dài
      >
        {viewingPost && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Tiêu đề">
              <strong>{viewingPost.title}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Tác giả">
              {viewingPost.authorName}
            </Descriptions.Item>
            <Descriptions.Item label="Tags">
              {viewingPost.tags.map((tag) => (
                <Tag key={tag} color="blue">{tag}</Tag>
              ))}
            </Descriptions.Item>
            <Descriptions.Item label="Nội dung">
              {/* Giữ nguyên định dạng xuống dòng của nội dung gốc */}
              <div style={{ whiteSpace: 'pre-wrap', maxHeight: '400px', overflowY: 'auto' }}>
                {viewingPost.content}
              </div>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Space>
  );
}