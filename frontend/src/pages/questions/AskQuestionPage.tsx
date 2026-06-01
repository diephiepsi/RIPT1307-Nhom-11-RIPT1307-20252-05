import { App, Button, Card, Form, Input, Select, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TinyEditor } from '../../components/common/TinyEditor';
import type { Tag } from '../../models/qa';
import { questionsService } from '../../services/questions';

export function AskQuestionPage() {
  const { message } = App.useApp();
  const nav = useNavigate();
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    questionsService
      .tags()
      .then(setTags)
      .catch(() => void 0);
  }, []);

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Typography.Title level={3} style={{ margin: 0 }}>
        Đặt câu hỏi
      </Typography.Title>

      <Card>
        <Form
          layout="vertical"
          initialValues={{ tags: [] as string[], content: '' }}
          onFinish={async (values) => {
            try {
              const created = await questionsService.create(values);
              message.success('Đăng bài thành công');
              nav(`/questions/${created.id}`);
            } catch {
              message.error('Đăng bài thất bại');
            }
          }}
        >
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, min: 10 }]}>
            <Input />
          </Form.Item>

          <Form.Item name="tags" label="Tag" rules={[{ required: true }]}>
            <Select
              mode="multiple"
              placeholder="Chọn tag theo môn/lớp/khoa..."
              options={tags.map((t) => ({ label: t.name, value: t.name }))}
            />
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung"
            rules={[
              { required: true, message: 'Vui lòng nhập nội dung' },
              {
                validator: (_, v: string) =>
                  !v || v.replace(/<[^>]+>/g, '').trim().length >= 20
                    ? Promise.resolve()
                    : Promise.reject(new Error('Nội dung tối thiểu 20 ký tự')),
              },
            ]}
          >
            <TinyEditor />
          </Form.Item>

          <Button type="primary" htmlType="submit">
            Đăng câu hỏi
          </Button>
        </Form>
      </Card>
    </Space>
  );
}

