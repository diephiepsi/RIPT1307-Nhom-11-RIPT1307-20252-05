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
      // Guard: bảo vệ khỏi trường hợp API trả về object/null thay vì array
      setRows(Array.isArray(data) ? data : []);
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
      .then((data) => setTags(Array.isArray(data) ? data : []))
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
            <FireOutlined style={{ marginRight: 8 }} />
            Nổi bật
          </span>
        ),
        value: "hot",
      },
      {
        label: (
          <span>
            <ClockCircleOutlined style={{ marginRight: 8 }} />
            Mới nhất
          </span>
        ),
        value: "newest",
      },
      {
        label: (
          <span>
            <CalendarOutlined style={{ marginRight: 8 }} />
            Cũ nhất
          </span>
        ),
        value: "oldest",
      },
      {
        label: (
          <span>
            <LikeOutlined style={{ marginRight: 8 }} />
            Nhiều thích
          </span>
        ),
        value: "likes",
      },
      {
        label: (
          <span>
            <MessageOutlined style={{ marginRight: 8 }} />
            Nhiều trả lời
          </span>
        ),
        value: "answers",
      },
      {
        label: (
          <span>
            <EyeOutlined style={{ marginRight: 8 }} />
            Nhiều xem
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
            <QuestionCircleOutlined style={{ marginRight: 8 }} />
            Tất cả
          </span>
        ),
        value: "all",
      },
      {
        label: (
          <span>
            <CheckCircleOutlined style={{ marginRight: 8 }} />
            Đã trả lời
          </span>
        ),
        value: "answered",
      },
      {
        label: (
          <span>
            <ClockCircleOutlined style={{ marginRight: 8 }} />
            Chưa trả lời
          </span>
        ),
        value: "unanswered",
      },
    ],
    [],
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f5f6fa" }}>
      {/* Header thanh lịch */}
      <div
        style={{
          background: "#ffffff",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          padding: "16px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div>
          <Title
            level={3}
            style={{
              margin: 0,
              fontWeight: 700,
              color: "#1a1a2e",
              letterSpacing: "-0.02em",
              background: "linear-gradient(135deg, #1e293b 0%, #3b82f6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Hỏi đáp & Thảo luận
          </Title>
          <Text style={{ color: "#64748b", fontSize: 13 }}>
            Nơi chia sẻ kiến thức và nhận hỗ trợ từ cộng đồng
          </Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => navigate("/ask")}
          style={{
            borderRadius: 40,
            fontWeight: 700,
            height: 44,
            paddingLeft: 28,
            paddingRight: 28,
            background: "linear-gradient(105deg, #2563eb 0%, #1d4ed8 100%)",
            border: "none",
            boxShadow: "0 6px 16px -2px rgba(37,99,235,0.3)",
          }}
        >
          Đặt câu hỏi
        </Button>
      </div>

      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "32px 24px",
        }}
      >
        {/* Bộ lọc đẹp */}
        <Card
          className="ub-card"
          style={{
            borderRadius: 20,
            marginBottom: 32,
            background: "#ffffff",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              width: "100%",
            }}
          >
            <Input
              allowClear
              size="large"
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              value={q}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setQ(e.target.value)
              }
              placeholder="Tìm kiếm câu hỏi..."
              style={{
                borderRadius: 60,
                border: "1px solid #e2e8f0",
                height: 48,
                fontSize: 15,
                background: "#f8fafc",
              }}
            />
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                alignItems: "center",
              }}
            >
              <Select
                value={sort}
                onChange={setSort}
                style={{ minWidth: 160, borderRadius: 30 }}
                options={sortOptions}
              />
              <Select
                value={status}
                onChange={setStatus}
                style={{ minWidth: 160, borderRadius: 30 }}
                options={statusOptions}
              />
              <Select
                allowClear
                showSearch
                placeholder={
                  <span>
                    <TagOutlined style={{ marginRight: 6 }} /> Lọc tag
                  </span>
                }
                value={tag}
                onChange={setTag}
                style={{ minWidth: 180, borderRadius: 30 }}
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
                  style={{
                    borderRadius: 40,
                    fontWeight: 600,
                    borderColor: bookmarked ? undefined : "#cbd5e1",
                    boxShadow: bookmarked
                      ? "0 4px 10px rgba(37,99,235,0.2)"
                      : "none",
                  }}
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
                  style={{ borderRadius: 40 }}
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Danh sách câu hỏi */}
        <Spin spinning={loading}>
          {rows.length === 0 ? (
            <div
              style={{
                background: "#fff",
                borderRadius: 24,
                padding: "80px 24px",
                textAlign: "center",
                boxShadow: "0 8px 30px -6px rgba(0,0,0,0.04)",
                border: "1px solid #f0f2f5",
              }}
            >
              <Empty description="Chưa có câu hỏi nào phù hợp" />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
                    hoverable
                    className="ub-card"
                    style={{
                      borderRadius: 24,
                      transition: "all 0.3s ease",
                      background: "#ffffff",
                    }}
                    onClick={() => navigate(`/questions/${item.id}`)}
                  >
                    <div style={{ padding: "22px 24px" }}>
                      {/* Trên cùng: tags + tác giả */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 10,
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        <Space size={6} wrap>
                          {isHot && (
                            <Tag
                              icon={<FireOutlined />}
                              color="volcano"
                              style={{
                                borderRadius: 20,
                                fontWeight: 700,
                                padding: "2px 14px",
                                lineHeight: "24px",
                                fontSize: 12,
                              }}
                            >
                              HOT
                            </Tag>
                          )}
                          {item.isBookmarked && (
                            <Tag
                              icon={<StarFilled />}
                              color="gold"
                              style={{
                                borderRadius: 20,
                                fontWeight: 700,
                                padding: "2px 14px",
                                lineHeight: "24px",
                                fontSize: 12,
                              }}
                            >
                              Đã lưu
                            </Tag>
                          )}
                        </Space>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <Avatar
                            size={32}
                            icon={<UserOutlined />}
                            style={{
                              background:
                                "linear-gradient(145deg, #4f46e5, #7c3aed)",
                            }}
                          />
                          <div>
                            <Text
                              strong
                              style={{
                                display: "block",
                                fontSize: 13,
                                color: "#1e293b",
                              }}
                            >
                              {item.author?.fullName || "Thành viên"}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              <ClockCircleOutlined />{" "}
                              {formatDate(item.createdAt)}
                            </Text>
                          </div>
                        </div>
                      </div>

                      {/* Tiêu đề câu hỏi */}
                      <div style={{ marginBottom: 12 }}>
                        <Title
                          level={4}
                          style={{
                            margin: 0,
                            fontSize: 18,
                            fontWeight: 700,
                            lineHeight: 1.4,
                            color: "#0f172a",
                          }}
                        >
                          <Link
                            to={`/questions/${item.id}`}
                            onClick={(e: MouseEvent<HTMLAnchorElement>) =>
                              e.stopPropagation()
                            }
                            style={{
                              color: "inherit",
                              textDecoration: "none",
                              transition: "color 0.2s",
                            }}
                            onMouseEnter={(e: MouseEvent<HTMLAnchorElement>) =>
                              (e.currentTarget.style.color = "#2563eb")
                            }
                            onMouseLeave={(e: MouseEvent<HTMLAnchorElement>) =>
                              (e.currentTarget.style.color = "#0f172a")
                            }
                          >
                            {item.title}
                          </Link>
                        </Title>
                      </div>

                      {/* Thẻ */}
                      <div style={{ marginBottom: 16 }}>
                        <Space size={[6, 8]} wrap>
                          {item.tags?.map((t) => (
                            <Tag
                              key={t.id || t.name}
                              onClick={(e: MouseEvent<HTMLSpanElement>) => {
                                e.stopPropagation();
                                setTag(t.name);
                              }}
                              style={{
                                background: "#f1f5f9",
                                color: "#334155",
                                border: "none",
                                borderRadius: 40,
                                padding: "3px 14px",
                                fontWeight: 600,
                                fontSize: 12,
                                cursor: "pointer",
                              }}
                            >
                              {t.name}
                            </Tag>
                          ))}
                        </Space>
                      </div>

                      {/* Chỉ số */}
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: 20,
                          borderTop: "1px solid #f1f5f9",
                          paddingTop: 14,
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            color: "#475569",
                            fontSize: 13,
                          }}
                        >
                          <LikeOutlined />
                          {likes}
                        </span>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            color: "#475569",
                            fontSize: 13,
                          }}
                        >
                          <DislikeOutlined />
                          {dislikes}
                        </span>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            color: "#16a34a",
                            fontSize: 13,
                          }}
                        >
                          <MessageOutlined />
                          {answers} trả lời
                        </span>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            color: "#64748b",
                            fontSize: 13,
                          }}
                        >
                          <EyeOutlined />
                          {views} lượt xem
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Spin>

        {/* Thẻ thịnh hành – nhẹ nhàng, đẹp mắt */}
        <div
          style={{
            marginTop: 48,
            padding: "24px 0",
            borderTop: "1px solid #e9eef2",
          }}
        >
          <Text
            strong
            style={{
              display: "block",
              marginBottom: 14,
              color: "#334155",
              fontSize: 15,
            }}
          >
            <TagsOutlined style={{ marginRight: 8 }} />
            Thẻ phổ biến
          </Text>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {tags.slice(0, 12).map((t) => (
              <Tag
                key={t.id || t.name}
                onClick={() => setTag(t.name)}
                style={{
                  background: "#ffffff",
                  border: "1px solid #d1d5db",
                  borderRadius: 30,
                  padding: "6px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "#374151",
                  transition: "all 0.2s",
                }}
              >
                {t.name}
              </Tag>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
