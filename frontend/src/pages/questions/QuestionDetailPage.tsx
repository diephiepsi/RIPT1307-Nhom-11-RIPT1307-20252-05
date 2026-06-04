import { App, Button, Divider, Input, Space, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { QuestionDetail } from '../../models/qa';
import { questionsService } from '../../services/questions';
import { useAppSelector } from '../../store/hooks';

// Thiết kế lại bộ nút Vote dạng cột dọc chuẩn Stack Overflow
function StackVoteButtons({ 
  score, 
  onVote 
}: { 
  score: number; 
  onVote: (v: -1 | 0 | 1) => void 
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '45px', gap: '4px' }}>
      <Button 
        shape="circle" 
        style={{ border: '1px solid #babfc4', color: '#6a737c' }}
        onClick={() => onVote(1)}
      >
        ▲
      </Button>
      <span style={{ fontSize: '1.3rem', fontWeight: 600, color: '#232629', margin: '4px 0' }}>
        {score}
      </span>
      <Button 
        shape="circle" 
        style={{ border: '1px solid #babfc4', color: '#6a737c' }}
        onClick={() => onVote(-1)}
      >
        ▼
      </Button>
      <Button 
        type="link" 
        size="small" 
        style={{ fontSize: '0.7rem', color: '#9199a1', padding: 0, marginTop: '4px' }}
        onClick={() => onVote(0)}
      >
        Clear
      </Button>
    </div>
  );
}

export function QuestionDetailPage() {
  const { id } = useParams();
  const { message } = App.useApp();
  const { token } = useAppSelector((s) => s.auth);
  const [data, setData] = useState<QuestionDetail | null>(null);
  const [comment, setComment] = useState('');

  const load = async () => {
    if (!id) return;
    try {
      setData(await questionsService.get(id));
    } catch {
      message.error('Không tải được chi tiết câu hỏi');
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!data) return null;

  return (
    <div style={{ fontFamily: 'sans-serif', color: '#232629' }}>
      
      {/* 1. KHU VỰC TIÊU ĐỀ BÀI VIẾT VÀ METADATA */}
      <div style={{ borderBottom: '1px solid #e3e6e8', paddingBottom: '16px', marginBottom: '16px' }}>
        <Typography.Title level={2} style={{ margin: '0 0 8px 0', fontWeight: 400, color: '#3b4045', fontSize: '1.6rem' }}>
          {data.title}
        </Typography.Title>
        
        {/* Hàng thông tin phụ dưới tiêu đề */}
        <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: '#6a737c' }}>
          <span>Asked <span style={{ color: '#232629' }}>{data.createdAt ? new Date(data.createdAt).toLocaleDateString() : ''}</span></span>
          <span>By <span style={{ color: '#0074cc' }}>{data.author.fullName}</span></span>
        </div>
      </div>

      {/* 2. BỐ CỤC CHÍNH: HỆ THỐNG VOTE + NỘI DUNG CÂU HỎI */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        
        {/* Cột trái: Bộ nút Vote */}
        <StackVoteButtons 
          score={data.votes.score} 
          onVote={async (v) => {
            try {
              await questionsService.voteQuestion(data.id, v);
              await load();
              message.success('Đã cập nhật vote');
            } catch {
              message.error('Vote thất bại');
            }
          }}
        />

        {/* Cột phải: Chi tiết nội dung văn bản */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Nội dung câu hỏi chạy mã HTML */}
          <div 
            style={{ lineHeight: '1.6', fontSize: '0.95rem', minHeight: '100px' }}
            dangerouslySetInnerHTML={{ __html: data.content }} 
          />

          {/* Tags hiển thị bên dưới nội dung */}
          <div style={{ marginTop: '24px', display: 'flex', gap: '6px' }}>
            {data.tags.map((t) => (
              <Tag 
                key={t.id} 
                style={{ 
                  backgroundColor: '#e1ecf4', 
                  color: '#39739d', 
                  borderColor: 'transparent',
                  padding: '2px 6px',
                  borderRadius: '3px'
                }}
              >
                {t.name}
              </Tag>
            ))}
          </div>

          <Divider style={{ margin: '16px 0 8px 0' }} />

          {/* 3. KHU VỰC BÌNH LUẬN (COMMENTS LIST) */}
          <div style={{ paddingLeft: '8px' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#525960', marginBottom: '8px' }}>
              Comments ({data.comments.length})
            </div>
            
            {/* Vòng lặp kết quả bình luận dạng chuỗi phẳng mỏng */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {data.comments.map((c) => (
                <div 
                  key={c.id} 
                  style={{
                    padding: '8px 0',
                    borderBottom: '1px dashed #eff0f1',
                    fontSize: '0.82rem',
                    lineHeight: '1.4'
                  }}
                >
                  {/* Điểm vote nhỏ nằm ngang text */}
                  <span style={{ color: '#b1b4b6', marginRight: '6px', fontWeight: 500 }}>
                    {c.votes.score > 0 ? `${c.votes.score}` : ''}
                  </span>
                  
                  {/* Nội dung comment */}
                  <span style={{ color: '#3b4045' }}>{c.content}</span>
                  
                  {/* Meta comment: Tên tác giả + Nút tương tác vote comment */}
                  <span style={{ color: '#9199a1', marginLeft: '6px' }}>
                    – <span style={{ color: '#0074cc', cursor: 'pointer' }}>{c.author.fullName}</span>{' '}
                    <span style={{ color: '#9199a1' }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}</span>
                  </span>

                  {/* Cụm chỉnh sửa/Vote mini cho comment */}
                  <Space size="small" style={{ marginLeft: '12px' }}>
                    <span 
                      style={{ color: '#6a737c', cursor: 'pointer', fontSize: '0.75rem' }} 
                      onClick={() => {
                        questionsService.voteComment(c.id, 1).then(() => load()).catch(() => {});
                      }}
                    >
                      ▲
                    </span>
                    <span 
                      style={{ color: '#6a737c', cursor: 'pointer', fontSize: '0.75rem' }}
                      onClick={() => {
                        questionsService.voteComment(c.id, 0).then(() => load()).catch(() => {});
                      }}
                    >
                      Bỏ vote
                    </span>
                  </Space>
                </div>
              ))}
            </div>

            {/* Ô NHẬP BÌNH LUẬN MỚI */}
            <div style={{ marginTop: '16px' }}>
              <Input.TextArea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={token ? 'Add a comment...' : 'You must log in to comment'}
                disabled={!token}
                style={{ borderRadius: '3px', fontSize: '0.85rem' }}
              />
              <Button
                type="primary"
                size="small"
                disabled={!token || !comment.trim()}
                style={{ 
                  marginTop: '8px', 
                  backgroundColor: '#0a95ff', 
                  borderColor: 'transparent',
                  borderRadius: '3px',
                  fontSize: '0.8rem'
                }}
                onClick={async () => {
                  if (!id) return;
                  try {
                    await questionsService.addComment(id, { content: comment.trim() });
                    setComment('');
                    await load();
                    message.success('Đã thêm bình luận');
                  } catch {
                    message.error('Thêm bình luận thất bại');
                  }
                }}
              >
                Add comment
              </Button>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}