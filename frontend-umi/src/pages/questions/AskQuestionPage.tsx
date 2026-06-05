import { App, Button, Form, Input, Select, Typography } from 'antd';
import { useEffect, useState } from 'react';
// Đã sửa 1: Dùng history của umi thay cho react-router-dom
import { history } from 'umi'; 
import { TinyEditor } from '../../components/common/TinyEditor';
// Đã sửa 2: Đường dẫn từ models sang types
import type { Tag } from '../../types/qa'; 
import { questionsService } from '../../services/questions';

export default function AskQuestionPage() { // Đã sửa 3: Thêm default
  const { message } = App.useApp();
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    questionsService
      .tags()
      .then(setTags)
      .catch(() => void 0);
  }, []);

  const formCardStyle = {
    background: '#ffffff',
    border: '1px solid #e3e6e8',
    borderRadius: '3px',
    padding: '24px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      <div style={{ marginBottom: '24px', paddingTop: '12px' }}>
        <Typography.Title level={2} style={{ margin: 0, fontWeight: 600, fontSize: '1.7rem', color: '#232629' }}>
          Ask a public question
        </Typography.Title>
      </div>

      <Form
        layout="vertical"
        initialValues={{ tags: [] as string[], content: '' }}
        requiredMark={false} 
        onFinish={async (values) => {
          try {
            const created = await questionsService.create(values);
            message.success('Đăng bài thành công');
            // Đã sửa 4: Dùng history.push
            history.push(`/questions/${created.id}`); 
          } catch {
            message.error('Đăng bài thất bại');
          }
        }}
      >
        
        {/* BLOCK 1: TIÊU ĐỀ (TITLE) */}
        <div style={formCardStyle}>
          <Form.Item 
            name="title" 
            label={
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#0c0d0e', lineHeight: '1.2' }}>Title</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 400, color: '#3b4045', marginTop: '4px' }}>
                  Be specific and imagine you’re asking a question to another person.
                </span>
              </div>
            }
            rules={[{ required: true, message: 'Please enter a title (min 10 characters)', min: 10 }]}
          >
            <Input 
              placeholder="e.g. Is there an R function for finding the index of an element?" 
              style={{ borderRadius: '3px', padding: '8px', fontSize: '0.9rem' }}
            />
          </Form.Item>
        </div>

        {/* BLOCK 2: NỘI DUNG CHI TIẾT (BODY WITH TINYEDITOR) */}
        <div style={formCardStyle}>
          <Form.Item
            name="content"
            label={
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#0c0d0e', lineHeight: '1.2' }}>Body</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 400, color: '#3b4045', marginTop: '4px' }}>
                  Introduce the problem and expand on what you put in the title. Minimum 20 characters.
                </span>
              </div>
            }
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
        </div>

        {/* BLOCK 3: THẺ PHÂN LOẠI (TAGS) */}
        <div style={formCardStyle}>
          <Form.Item 
            name="tags" 
            label={
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#0c0d0e', lineHeight: '1.2' }}>Tags</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 400, color: '#3b4045', marginTop: '4px' }}>
                  Add up to 5 tags to describe what your question is about.
                </span>
              </div>
            }
            rules={[{ required: true, message: 'Please select at least one tag' }]}
          >
            <Select
              mode="multiple"
              placeholder="e.g. (javascript reactjs c++)"
              options={tags.map((t) => ({ label: t.name, value: t.name }))}
              style={{ width: '100%' }}
              dropdownStyle={{ borderRadius: '3px' }}
              tagRender={({ label, onClose }) => (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: '#e1ecf4',
                  color: '#39739d',
                  padding: '2px 6px',
                  margin: '2px 4px 2px 0',
                  borderRadius: '3px',
                  fontSize: '0.78rem'
                }}>
                  {label}
                  <span 
                    onClick={onClose} 
                    style={{ marginLeft: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#2c5777' }}
                  >
                    ×
                  </span>
                </span>
              )}
            />
          </Form.Item>
        </div>

        {/* NÚT SUBMIT ĐĂNG BÀI VIẾT */}
        <div style={{ marginTop: '24px', marginBottom: '40px' }}>
          <Button 
            type="primary" 
            htmlType="submit"
            style={{
              backgroundColor: '#0a95ff',
              borderColor: 'transparent',
              borderRadius: '3px',
              padding: '12px 18px',
              height: 'auto',
              fontWeight: 500,
              fontSize: '0.95rem',
              boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.4)'
            }}
          >
            Post your question
          </Button>
        </div>

      </Form>
    </div>
  );
}