import React, { useEffect, useMemo, useState } from 'react';
import { App, Button, Space, Table, Typography, Tag, Modal, Descriptions } from 'antd';
import { adminApi } from '@/services/api'; // Đảm bảo đường dẫn này đúng

type AdminPostRow = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  authorName: string;
  score: number;
  isApproved: boolean;
};

export default function AdminPostsPage() {
  const { message, modal } = App.useApp(); // Umi/Antd bọc sẵn App
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AdminPostRow[]>([]);
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
          r.isApproved ? <Tag color="green">Đã duyệt</Tag> : <Tag color="orange">Chờ duyệt</Tag>
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
            <Button onClick={() => setViewingPost(r)}>Xem</Button>
            {!r.isApproved && (
              <Button type="primary" onClick={async () => {
                try {
                  await adminApi.approvePost(r.id);
                  message.success('Đã duyệt bài viết');
                  await load();
                } catch {
                  message.error('Lỗi khi duyệt bài');
                }
              }}>Duyệt</Button>
            )}
            <Button danger onClick={() => {
              modal.confirm({
                title: 'Xóa bài?',
                content: 'Thao tác này không thể hoàn tác.',
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
            }}>Xóa</Button>
          </Space>
        ),
      },
    ],
    [message, modal],
  );

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Typography.Title level={3} style={{ margin: 0 }}>Quản trị bài đăng</Typography.Title>
      <Table rowKey="id" loading={loading} columns={columns} dataSource={rows} />

      <Modal
        title="Chi tiết bài đăng"
        open={!!viewingPost}
        onCancel={() => setViewingPost(null)}
        footer={<Button onClick={() => setViewingPost(null)}>Đóng</Button>}
        width={800}
      >
        {viewingPost && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Tiêu đề"><strong>{viewingPost.title}</strong></Descriptions.Item>
            <Descriptions.Item label="Tác giả">{viewingPost.authorName}</Descriptions.Item>
            <Descriptions.Item label="Tags">
              {viewingPost.tags.map((tag) => <Tag key={tag} color="blue">{tag}</Tag>)}
            </Descriptions.Item>
            <Descriptions.Item label="Nội dung">
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