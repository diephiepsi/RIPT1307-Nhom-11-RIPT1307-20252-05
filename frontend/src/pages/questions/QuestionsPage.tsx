import {
  App,
  Avatar,
  Badge,
  Button,
  Card,
  Empty,
  Input,
  Progress,
  Select,
  Space,
  Spin,
  Statistic,
  Tag as AntTag,
  Tooltip,
  Typography,
} from 'antd';
import {
  BookOutlined,
  FireOutlined,
  LikeFilled,
  DislikeFilled,
  MessageOutlined,
  PlusOutlined,
  SearchOutlined,
  StarFilled,
  EyeOutlined,
} from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { QuestionListItem, Tag } from '../../models/qa';
import { questionsService, type QuestionSort, type QuestionStatus } from '../../services/questions';
import './QuestionList.css';

const getLikes = (q: QuestionListItem) => q.likesCount ?? q.votes?.likesCount ?? q.votes?.up ?? 0;
const getDislikes = (q: QuestionListItem) => q.dislikesCount ?? q.votes?.dislikesCount ?? q.votes?.down ?? 0;
const getAnswers = (q: QuestionListItem) => q.answersCount ?? q.commentsCount ?? 0;
const getViews = (q: QuestionListItem) => q.viewsCount ?? 0;
const stripHtml = (html = '') => html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
const timeText = (date: string) => new Date(date).toLocaleDateString('vi-VN');

export function QuestionsPage() {
  const { message } = App.useApp();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<QuestionListItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [q, setQ] = useState('');
  const [tag, setTag] = useState<string | undefined>();
  const [sort, setSort] = useState<QuestionSort>('hot');
  const [status, setStatus] = useState<QuestionStatus>('all');
  const [bookmarked, setBookmarked] = useState(false);

  const stats = useMemo(() => {
    const totalLikes = rows.reduce((sum, item) => sum + getLikes(item), 0);
    const totalAnswers = rows.reduce((sum, item) => sum + getAnswers(item), 0);
    const totalViews = rows.reduce((sum, item) => sum + getViews(item), 0);
    return { total: rows.length, totalLikes, totalAnswers, totalViews };
  }, [rows]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await questionsService.list({
        q: q.trim() || undefined,
        tag,
        sort,
        status,
        bookmarked: bookmarked || undefined,
      });
      setRows(data);
    } catch {
      message.error('Không tải được danh sách câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    questionsService.tags().then(setTags).catch(() => void 0);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, tag, sort, status, bookmarked]);

  return (
    <div className="qa-page-shell">
      <section className="qa-hero">
        <div>
          <div className="qa-kicker"><FireOutlined /> UniBrain Q&A</div>
          <Typography.Title className="qa-hero-title">Hỏi đáp học thuật thông minh</Typography.Title>
          <Typography.Paragraph className="qa-hero-desc">
            Tìm câu hỏi, lọc theo tag, xem Like/Dislike thật từ backend và theo dõi các chủ đề đang hot.
          </Typography.Paragraph>
          <Space wrap>
            <Input
              size="large"
              allowClear
              prefix={<SearchOutlined />}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm React, MySQL, thuật toán..."
              className="qa-search"
            />
            <Button size="large" type="primary" icon={<PlusOutlined />} onClick={() => nav('/ask')}>
              Đặt câu hỏi
            </Button>
          </Space>
        </div>
        <div className="qa-hero-stats">
          <Statistic title="Câu hỏi" value={stats.total} />
          <Statistic title="Like" value={stats.totalLikes} prefix={<LikeFilled />} />
          <Statistic title="Trả lời" value={stats.totalAnswers} prefix={<MessageOutlined />} />
          <Statistic title="Lượt xem" value={stats.totalViews} prefix={<EyeOutlined />} />
        </div>
      </section>

      <div className="qa-layout">
        <main className="qa-main">
          <Card className="qa-toolbar">
            <Space wrap>
              <Select value={sort} onChange={setSort} className="qa-select" options={[
                { label: 'Hot nhất', value: 'hot' },
                { label: 'Mới nhất', value: 'newest' },
                { label: 'Cũ nhất', value: 'oldest' },
                { label: 'Nhiều like', value: 'likes' },
                { label: 'Nhiều trả lời', value: 'answers' },
                { label: 'Nhiều lượt xem', value: 'views' },
              ]} />
              <Select value={status} onChange={setStatus} className="qa-select" options={[
                { label: 'Tất cả', value: 'all' },
                { label: 'Đã trả lời', value: 'answered' },
                { label: 'Chưa trả lời', value: 'unanswered' },
              ]} />
              <Select allowClear placeholder="Lọc theo tag" value={tag} onChange={setTag} className="qa-select" options={tags.map((t) => ({ label: t.name, value: t.name }))} />
              <Button icon={<BookOutlined />} type={bookmarked ? 'primary' : 'default'} onClick={() => setBookmarked((v) => !v)}>
                Đã lưu
              </Button>
            </Space>
          </Card>

          <Spin spinning={loading}>
            {rows.length === 0 ? <Empty description="Chưa có câu hỏi phù hợp" /> : rows.map((item) => {
              const likes = getLikes(item);
              const dislikes = getDislikes(item);
              const answers = getAnswers(item);
              const views = getViews(item);
              const total = Math.max(1, likes + dislikes);
              const likePercent = Math.round((likes / total) * 100);
              const hot = (item.hotScore ?? 0) >= 8 || likes >= 5 || answers >= 3;

              return (
                <Badge.Ribbon key={item.id} text={hot ? 'HOT' : 'Q&A'} color={hot ? 'volcano' : 'blue'}>
                  <Card className="qa-question-card" hoverable>
                    <div className="qa-card-grid">
                      <div className="qa-vote-column">
                        <Tooltip title="Số like thật từ backend"><div className="qa-pill like"><LikeFilled /> {likes}</div></Tooltip>
                        <Tooltip title="Số dislike thật từ backend"><div className="qa-pill dislike"><DislikeFilled /> {dislikes}</div></Tooltip>
                        <div className="qa-pill answer"><MessageOutlined /> {answers}</div>
                        <div className="qa-pill view"><EyeOutlined /> {views}</div>
                      </div>

                      <div className="qa-card-content">
                        <Link to={`/questions/${item.id}`} className="qa-title-link">{item.title}</Link>
                        <div className="qa-meta">
                          <Avatar size="small">{item.author?.fullName?.[0] ?? 'U'}</Avatar>
                          <span>{item.author?.fullName}</span>
                          <span>•</span>
                          <span>{timeText(item.createdAt)}</span>
                          {item.isBookmarked && <span className="qa-saved"><StarFilled /> đã lưu</span>}
                        </div>
                        <div className="qa-tags">
                          {item.tags?.map((t) => <AntTag key={t.id || t.name} onClick={() => setTag(t.name)}>{t.name}</AntTag>)}
                        </div>
                        <Progress percent={likePercent} size="small" showInfo={false} className="qa-like-progress" />
                      </div>
                    </div>
                  </Card>
                </Badge.Ribbon>
              );
            })}
          </Spin>
        </main>

        <aside className="qa-sidebar">
          <Card className="qa-side-card" title="Tag phổ biến">
            <Space wrap>
              {tags.slice(0, 18).map((t) => <AntTag key={t.id || t.name} className="qa-side-tag" onClick={() => setTag(t.name)}>{t.name}</AntTag>)}
            </Space>
          </Card>
          <Card className="qa-side-card" title="Gợi ý tính năng">
            <p>Backend đã trả riêng <b>likesCount</b>, <b>dislikesCount</b>, <b>viewsCount</b>, <b>isBookmarked</b>.</p>
            <p>Frontend có Hot sort, lọc đã lưu, lọc chưa trả lời, thống kê tổng.</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
