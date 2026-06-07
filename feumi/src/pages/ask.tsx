import { Button, Card, Form, Input, Select, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { history } from 'umi';
import { TinyEditor } from '../components/common/TinyEditor';
import { questionsService } from '../services/questions';
import type { Tag } from '../models/qa';

export default function AskQuestionPage() {
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    void questionsService.tags().then(setTags).catch(() => undefined);
  }, []);

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '24px' }}>
      <Card style={{ borderRadius: 18, boxShadow: '0 18px 40px rgba(15,23,42,0.08)' }}>
        <Typography.Title level={3}>Đặt câu hỏi mới</Typography.Title>
        <Typography.Paragraph type="secondary">
          Hãy mô tả vấn đề của bạn rõ ràng để cộng đồng hỗ trợ nhanh hơn.
        </Typography.Paragraph>
        <Form
          layout="vertical"
          initialValues={{ tags: [] as string[], content: '' }}
          onFinish={async (values) => {
            setLoading(true);
            try {
              const created = await questionsService.create(values);
              history.push(`/questions/${created.id}`);
            } catch (error) {
              console.error(error);
            } finally {
              setLoading(false);
            }
          }}
        >
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, min: 10 }]}> 
            <Input placeholder="Ví dụ: Cách tối ưu truy vấn Prisma..." />
          </Form.Item>

          <Form.Item name="content" label="Nội dung" rules={[{ required: true, min: 20 }]}> 
            <TinyEditor />
          </Form.Item>

          <Form.Item name="tags" label="Thẻ" rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 thẻ' }]}> 
            <Select mode="tags" placeholder="Thêm thẻ" options={tags.map((item) => ({ label: item.name, value: item.name }))} />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={loading}>
            Gửi câu hỏi
          </Button>
        </Form>
      </Card>
    </div>
  );
}
