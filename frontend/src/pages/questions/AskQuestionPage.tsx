import { App, Button, Form, Input, Select, Typography } from 'antd';
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
          Đặt câu hỏi mới công khai
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
            nav(`/questions/${created.id}`);
          } catch {
            message.error('Đăng bài thất bại');
          }
        }}
      >
        
        {/* BLOCK 1: TIÊU ĐỀ  */}
        <div style={formCardStyle}>
          <Form.Item 
            name="title" 
            label={
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#0c0d0e', lineHeight: '1.2' }}>Tiêu đề</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 400, color: '#3b4045', marginTop: '4px' }}>
                  Hãy cụ thể và tưởng tượng của bạn đang đặt câu hỏi cho người khác.
                </span>
              </div>
            }
            rules={[{ required: true, message: 'Tiêu đề tối thiếu 10 ký tự', min: 10 }]}
          >
            <Input 
              placeholder=" Bắt đầu bằng từ 'Làm thế nào để...' hoặc 'Tại sao...' và kết thúc bằng dấu hỏi (?)" 
              style={{ borderRadius: '3px', padding: '8px', fontSize: '0.9rem' }}
            />
          </Form.Item>
        </div>

        {/* BLOCK 2: NỘI DUNG  */}
        <div style={formCardStyle}>
          <Form.Item
            name="content"
            label={
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#0c0d0e', lineHeight: '1.2' }}>Nội dung</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 400, color: '#3b4045', marginTop: '4px' }}>
                  Giới thiệu vấn đề và mở rộng về điều bạn đã viết trong tiêu đề. Tối thiểu 20 ký tự.
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

        {/* BLOCK 3: THẺ PHÂN LOẠI */}
        <div style={formCardStyle}>
          <Form.Item 
            name="tags" 
            label={
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#0c0d0e', lineHeight: '1.2' }}>Tags</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 400, color: '#3b4045', marginTop: '4px' }}>
                  Thêm tối đa 5 thẻ để mô tả câu hỏi của bạn.
                </span>
              </div>
            }
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một thẻ' }]}
          >
            <Select
              mode="multiple"
              placeholder="Ví dụ: javascript, react, css"
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

        {/* NÚT ĐĂNG BÀI VIẾT */}
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
            Đăng câu hỏi
          </Button>
        </div>

      </Form>
    </div>
  );
}