import {
  App,
  Avatar,
  Button,
  Card,
  Empty,
  Input,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  Tooltip,
} from "antd";
import {
  ClockCircleOutlined,
  EyeOutlined,
  FireOutlined,
  MessageOutlined,
  PlusOutlined,
  SearchOutlined,
  StarFilled,
  TagsOutlined,
  LikeOutlined,
  DislikeOutlined,
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  QuestionCircleOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import { Link, useNavigate } from "umi";
import type { QuestionListItem, Tag as TagModel } from "../../models/qa";
import {
  questionsService,
  type QuestionSort,
  type QuestionStatus,
} from "../../services/questions";

const { Title, Text } = Typography;

const getLikes = (q: QuestionListItem) =>
  q.likesCount ?? q.votes?.likesCount ?? q.votes?.up ?? 0;
const getDislikes = (q: QuestionListItem) =>
  q.dislikesCount ?? q.votes?.dislikesCount ?? q.votes?.down ?? 0;
const getAnswers = (q: QuestionListItem) =>
  q.answersCount ?? q.commentsCount ?? 0;
const getViews = (q: QuestionListItem) => q.viewsCount ?? 0;

const formatDate = (date?: string) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("vi-VN");
};

export default function QuestionsPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<QuestionListItem[]>([]);
  const [tags, setTags] = useState<TagModel[]>([]);

  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | undefined>();
  const [sort, setSort] = useState<QuestionSort>("hot");
  const [status, setStatus] = useState<QuestionStatus>("all");
  const [bookmarked, setBookmarked] = useState(false);

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
    } catch (err: any) {
      message.error(
        err?.response?.data?.message || "Không tải được danh sách câu hỏi",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    questionsService
      .tags()
      .then(setTags)
      .catch(() => void 0);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 300);
    return () => window.clearTimeout(timer);
  }, [q, tag, sort, status, bookmarked]);

  const sortOptions = useMemo(
    () => [
      {
        label: (
          <span>
            <FireOutlined className="icon-mr" /> Nổi bật
          </span>
        ),
        value: "hot",
      },
      {
        label: (
          <span>
            <ClockCircleOutlined className="icon-mr" /> Mới nhất
          </span>
        ),
        value: "newest",
      },
      {
        label: (
          <span>
            <CalendarOutlined className="icon-mr" /> Cũ nhất
          </span>
        ),
        value: "oldest",
      },
      {
        label: (
          <span>
            <LikeOutlined className="icon-mr" /> Nhiều thích
          </span>
        ),
        value: "likes",
      },
      {
        label: (
          <span>
            <MessageOutlined className="icon-mr" /> Nhiều trả lời
          </span>
        ),
        value: "answers",
      },
      {
        label: (
          <span>
            <EyeOutlined className="icon-mr" /> Nhiều xem
          </span>
        ),
        value: "views",
      },
    ],
    [],
  );

  const statusOptions = useMemo(
    () => [
      {
        label: (
          <span>
            <QuestionCircleOutlined className="icon-mr" /> Tất cả
          </span>
        ),
        value: "all",
      },
      {
        label: (
          <span>
            <CheckCircleOutlined className="icon-mr" /> Đã trả lời
          </span>
        ),
        value: "answered",
      },
      {
        label: (
          <span>
            <ClockCircleOutlined className="icon-mr" /> Chưa trả lời
          </span>
        ),
        value: "unanswered",
      },
    ],
    [],
  );

  return (
    <>
      <style>{`
        /* Global Color Variables */
        :root {
          --color-bg-body: #f8fafc;
          --color-bg-surface: #ffffff;
          --color-primary: #2563eb;
          --color-primary-hover: #1d4ed8;
          --color-text-main: #0f172a;
          --color-text-secondary: #475569;
          --color-text-muted: #94a3b8;
          --color-border: #e2e8f0;
          --color-hot: #ef4444;
          --color-bookmark: #eab308;
          --color-success: #16a34a;
        }

        .qa-page-wrapper {
          min-height: 100vh;
          background-color: var(--color-bg-body);
        }

        /* Header Styles */
        .qa-header {
          background-color: var(--color-bg-surface);
          border-bottom: 1px solid var(--color-border);
          padding: 16px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          position: sticky;
          top: 0;
          z-index: 20;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
        }

        .qa-header-title {
          margin: 0 !important;
          font-weight: 700 !important;
          color: var(--color-text-main) !important;
          font-size: 24px !important;
        }

        .qa-header-subtitle {
          color: var(--color-text-secondary);
          font-size: 14px;
        }

        .btn-ask {
          border-radius: 8px !important;
          font-weight: 600 !important;
          height: 40px !important;
          padding: 0 24px !important;
          background-color: var(--color-primary) !important;
          box-shadow: none !important;
        }

        .btn-ask:hover {
          background-color: var(--color-primary-hover) !important;
        }

        /* Main Content Styles */
        .qa-main-content {
          max-width: 1080px;
          margin: 0 auto;
          padding: 32px 24px;
        }

        /* Filter Section */
        .qa-filter-card {
          border-radius: 12px !important;
          margin-bottom: 24px;
          background-color: var(--color-bg-surface);
          border: 1px solid var(--color-border) !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02) !important;
        }

        .qa-filter-card .ant-card-body {
          padding: 20px;
        }

        .search-input {
          border-radius: 8px !important;
          height: 44px;
          font-size: 15px;
        }

        .filter-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          margin-top: 16px;
        }

        .filter-select {
          min-width: 160px;
        }

        .filter-select .ant-select-selector {
          border-radius: 8px !important;
        }

        .btn-action {
          border-radius: 8px !important;
          font-weight: 500 !important;
        }

        /* Question List */
        .qa-list-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .qa-empty-state {
          background: var(--color-bg-surface);
          border-radius: 12px;
          padding: 80px 24px;
          text-align: center;
          border: 1px solid var(--color-border);
        }

        .question-card {
          border-radius: 12px !important;
          border: 1px solid var(--color-border) !important;
          transition: border-color 0.2s, box-shadow 0.2s !important;
          background: var(--color-bg-surface);
        }

        .question-card:hover {
          border-color: #cbd5e1 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
        }

        .question-card .ant-card-body {
          padding: 20px 24px;
        }

        /* Card Meta */
        .card-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .badge-tag {
          border-radius: 6px !important;
          font-weight: 600 !important;
          padding: 2px 10px !important;
          font-size: 12px !important;
          border: none !important;
        }

        .badge-hot { background-color: #fef2f2 !important; color: var(--color-hot) !important; }
        .badge-saved { background-color: #fefce8 !important; color: var(--color-bookmark) !important; }

        .author-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .author-avatar {
          background-color: var(--color-border);
          color: var(--color-text-secondary);
        }

        .author-name {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text-main);
        }

        .post-date {
          font-size: 12px;
          color: var(--color-text-muted);
        }

        /* Question Title */
        .question-title {
          margin: 0 0 12px 0 !important;
          font-size: 18px !important;
          font-weight: 600 !important;
          line-height: 1.5 !important;
        }

        .question-title a {
          color: var(--color-text-main);
          text-decoration: none;
          transition: color 0.2s;
        }

        .question-title a:hover {
          color: var(--color-primary);
        }

        /* Topic Tags */
        .topic-tag {
          background-color: var(--color-bg-body) !important;
          color: var(--color-text-secondary) !important;
          border: 1px solid var(--color-border) !important;
          border-radius: 6px !important;
          padding: 2px 12px !important;
          font-weight: 500 !important;
          font-size: 13px !important;
          cursor: pointer;
          transition: all 0.2s !important;
        }

        .topic-tag:hover {
          background-color: var(--color-border) !important;
          color: var(--color-text-main) !important;
        }

        /* Stats Row */
        .stats-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 24px;
          border-top: 1px solid var(--color-border);
          padding-top: 16px;
          margin-top: 16px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: var(--color-text-secondary);
          font-weight: 500;
        }

        .stat-item.highlight { color: var(--color-success); }

        /* Popular Tags Footer */
        .popular-tags-section {
          margin-top: 40px;
          padding-top: 24px;
          border-top: 1px solid var(--color-border);
        }

        .popular-tags-title {
          display: block;
          margin-bottom: 16px;
          color: var(--color-text-main);
          font-size: 16px;
          font-weight: 600;
        }

        .icon-mr { margin-right: 8px; }
      `}</style>

      <div className="qa-page-wrapper">
        <div className="qa-header">
          <div>
            <Title level={3} className="qa-header-title">
              Hỏi đáp & Thảo luận
            </Title>
            <Text className="qa-header-subtitle">
              Nơi chia sẻ kiến thức và nhận hỗ trợ từ cộng đồng
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/ask")}
            className="btn-ask"
          >
            Đặt câu hỏi
          </Button>
        </div>

        <div className="qa-main-content">
          <Card className="qa-filter-card" bordered={false}>
            <Input
              allowClear
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              value={q}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setQ(e.target.value)
              }
              placeholder="Tìm kiếm câu hỏi..."
              className="search-input"
            />
            <div className="filter-controls">
              <Select
                value={sort}
                onChange={setSort}
                className="filter-select"
                options={sortOptions}
              />
              <Select
                value={status}
                onChange={setStatus}
                className="filter-select"
                options={statusOptions}
              />
              <Select
                allowClear
                showSearch
                placeholder={
                  <span>
                    <TagOutlined className="icon-mr" /> Lọc tag
                  </span>
                }
                value={tag}
                onChange={setTag}
                className="filter-select"
                style={{ minWidth: 180 }}
                options={tags.map((t) => ({
                  label: t.name,
                  value: t.name,
                }))}
              />
              <Tooltip title="Chỉ hiện câu hỏi đã lưu">
                <Button
                  type={bookmarked ? "primary" : "default"}
                  icon={<StarFilled />}
                  onClick={() => setBookmarked((v) => !v)}
                  className="btn-action"
                >
                  Đã lưu
                </Button>
              </Tooltip>
              {(q || tag || bookmarked || status !== "all") && (
                <Button
                  onClick={() => {
                    setQ("");
                    setTag(undefined);
                    setStatus("all");
                    setBookmarked(false);
                  }}
                  className="btn-action"
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          </Card>

          <Spin spinning={loading}>
            {rows.length === 0 ? (
              <div className="qa-empty-state">
                <Empty description="Chưa có câu hỏi nào phù hợp" />
              </div>
            ) : (
              <div className="qa-list-container">
                {rows.map((item) => {
                  const likes = getLikes(item);
                  const dislikes = getDislikes(item);
                  const answers = getAnswers(item);
                  const views = getViews(item);
                  const isHot =
                    (item.hotScore ?? 0) >= 8 ||
                    likes - dislikes >= 5 ||
                    answers >= 3 ||
                    views >= 100;

                  return (
                    <Card
                      key={item.id}
                      className="question-card"
                      bordered={false}
                      onClick={() => navigate(`/questions/${item.id}`)}
                    >
                      <div className="card-meta-row">
                        <Space size={8} wrap>
                          {isHot && (
                            <Tag
                              icon={<FireOutlined />}
                              className="badge-tag badge-hot"
                            >
                              HOT
                            </Tag>
                          )}
                          {item.isBookmarked && (
                            <Tag
                              icon={<StarFilled />}
                              className="badge-tag badge-saved"
                            >
                              Đã lưu
                            </Tag>
                          )}
                        </Space>
                        <div className="author-info">
                          <Avatar
                            size={36}
                            icon={<UserOutlined />}
                            className="author-avatar"
                          />
                          <div>
                            <Text className="author-name">
                              {item.author?.fullName || "Thành viên"}
                            </Text>
                            <span className="post-date">
                              <ClockCircleOutlined style={{ marginRight: 4 }} />
                              {formatDate(item.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Title level={4} className="question-title">
                        <Link
                          to={`/questions/${item.id}`}
                          onClick={(e: MouseEvent<HTMLAnchorElement>) =>
                            e.stopPropagation()
                          }
                        >
                          {item.title}
                        </Link>
                      </Title>

                      <Space size={[8, 8]} wrap>
                        {item.tags?.map((t) => (
                          <Tag
                            key={t.id || t.name}
                            onClick={(e: MouseEvent<HTMLSpanElement>) => {
                              e.stopPropagation();
                              setTag(t.name);
                            }}
                            className="topic-tag"
                          >
                            {t.name}
                          </Tag>
                        ))}
                      </Space>

                      <div className="stats-row">
                        <span className="stat-item">
                          <LikeOutlined /> {likes}
                        </span>
                        <span className="stat-item">
                          <DislikeOutlined /> {dislikes}
                        </span>
                        <span className="stat-item highlight">
                          <MessageOutlined /> {answers} trả lời
                        </span>
                        <span className="stat-item">
                          <EyeOutlined /> {views} lượt xem
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Spin>

          <div className="popular-tags-section">
            <span className="popular-tags-title">
              <TagsOutlined className="icon-mr" />
              Thẻ phổ biến
            </span>
            <Space wrap size={[12, 12]}>
              {tags.slice(0, 12).map((t) => (
                <Tag
                  key={t.id || t.name}
                  onClick={() => setTag(t.name)}
                  className="topic-tag"
                >
                  {t.name}
                </Tag>
              ))}
            </Space>
          </div>
        </div>
      </div>
    </>
  );
}
