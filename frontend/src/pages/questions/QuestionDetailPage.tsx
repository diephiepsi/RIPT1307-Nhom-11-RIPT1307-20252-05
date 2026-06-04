import {
  App,
  Avatar,
  Button,
  Card,
  Divider,
  Empty,
  Input,
  Progress,
  Space,
  Spin,
  Tag as AntTag,
  Timeline,
  Tooltip,
  Typography,
} from "antd";
import {
  BookOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  DislikeFilled,
  EyeOutlined,
  LikeFilled,
  MessageOutlined,
  SendOutlined,
  StarFilled,
} from "@ant-design/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { CommentItem, QuestionDetail } from "../../models/qa";
import { questionsService } from "../../services/questions";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const getLikes = (x?: { likesCount?: number; votes?: any }) =>
  x?.likesCount ?? x?.votes?.likesCount ?? x?.votes?.up ?? 0;

const getDislikes = (x?: { dislikesCount?: number; votes?: any }) =>
  x?.dislikesCount ?? x?.votes?.dislikesCount ?? x?.votes?.down ?? 0;

const formatDate = (date?: string) =>
  date ? new Date(date).toLocaleString("vi-VN") : "";

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #f3f7ff 0%, #f8fafc 45%, #ffffff 100%)",
  padding: "28px 20px 48px",
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
};

const mainCardStyle: React.CSSProperties = {
  borderRadius: 24,
  border: "1px solid #edf1f7",
  boxShadow: "0 14px 38px rgba(15, 23, 42, 0.07)",
  overflow: "hidden",
};

const sideCardStyle: React.CSSProperties = {
  borderRadius: 22,
  border: "1px solid #edf1f7",
  boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)",
  marginBottom: 16,
};

const voteButtonStyle: React.CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: 14,
};

const commentCardStyle: React.CSSProperties = {
  borderRadius: 18,
  border: "1px solid #edf1f7",
  marginBottom: 12,
  background: "#fff",
};

export function QuestionDetailPage() {
  const { id = "" } = useParams();
  const { message } = App.useApp();

  const viewedRef = useRef<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [comment, setComment] = useState("");
  const [commentSort, setCommentSort] = useState<"best" | "newest">("best");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!id) return;

    setLoading(true);

    try {
      const data = await questionsService.detail(id);
      setQuestion(data);
    } catch (err: any) {
      message.error(
        err?.response?.data?.message || "Không tải được chi tiết câu hỏi",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();

    // Fix lỗi React StrictMode làm useEffect chạy 2 lần ở môi trường dev.
    // Mỗi id câu hỏi chỉ gọi API tăng view đúng 1 lần.
    if (id && viewedRef.current !== id) {
      viewedRef.current = id;
      void questionsService.view(id).catch(() => void 0);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const comments = useMemo(() => {
    const list = [...(question?.comments ?? [])];

    if (commentSort === "newest") {
      return list.sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      );
    }

    return list.sort(
      (a, b) => getLikes(b) - getDislikes(b) - (getLikes(a) - getDislikes(a)),
    );
  }, [question?.comments, commentSort]);

  const handleVote = async (value: -1 | 0 | 1) => {
    if (!question) return;

    try {
      const nextValue = question.votes?.myVote === value ? 0 : value;
      const res = await questionsService.vote(question.id, nextValue);

      setQuestion({
        ...question,
        votes: res.votes,
        likesCount: res.votes.likesCount,
        dislikesCount: res.votes.dislikesCount,
      });
    } catch {
      message.warning("Bạn cần đăng nhập để vote");
    }
  };

  const handleBookmark = async () => {
    if (!question) return;

    try {
      const res = await questionsService.bookmark(question.id);

      setQuestion({
        ...question,
        isBookmarked: res.isBookmarked,
      });

      message.success(
        res.isBookmarked ? "Đã lưu câu hỏi" : "Đã bỏ lưu câu hỏi",
      );
    } catch {
      message.warning("Bạn cần đăng nhập để lưu câu hỏi");
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    message.success("Đã copy link câu hỏi");
  };

  const handleComment = async () => {
    if (!question || !comment.trim()) return;

    setSubmitting(true);

    try {
      const created = await questionsService.addComment(question.id, {
        content: comment.trim(),
      });

      setQuestion({
        ...question,
        comments: [...question.comments, created],
        answersCount: (question.answersCount ?? 0) + 1,
      });

      setComment("");
      message.success("Đã gửi bình luận");
    } catch {
      message.warning("Bạn cần đăng nhập để bình luận");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <Spin spinning>
            <Card style={{ ...mainCardStyle, minHeight: 320 }} />
          </Spin>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <Card style={mainCardStyle}>
            <Empty description="Không tìm thấy câu hỏi" />
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <Link to="/questions">Về danh sách</Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const likes = getLikes(question);
  const dislikes = getDislikes(question);
  const answers = question.answersCount ?? question.comments?.length ?? 0;
  const views = question.viewsCount ?? 0;
  const totalVotes = Math.max(1, likes + dislikes);
  const likePercent = Math.round((likes / totalVotes) * 100);

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Link to="/questions">
            <Button>← Về danh sách</Button>
          </Link>

          <Button icon={<CopyOutlined />} onClick={() => void handleCopy()}>
            Copy link
          </Button>

          <Button
            type={question.isBookmarked ? "primary" : "default"}
            icon={question.isBookmarked ? <StarFilled /> : <BookOutlined />}
            onClick={() => void handleBookmark()}
          >
            {question.isBookmarked ? "Đã lưu" : "Lưu câu hỏi"}
          </Button>
        </Space>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 300px",
            gap: 18,
            alignItems: "start",
          }}
        >
          <main>
            <Card style={mainCardStyle} styles={{ body: { padding: 0 } }}>
              <div
                style={{
                  padding: 24,
                  background:
                    "linear-gradient(135deg, rgba(22,119,255,0.98), rgba(64,169,255,0.9))",
                  color: "#fff",
                }}
              >
                <Space size={8} wrap style={{ marginBottom: 12 }}>
                  <AntTag color="blue">Chi tiết câu hỏi</AntTag>

                  {question.isBookmarked && (
                    <AntTag color="gold" icon={<StarFilled />}>
                      Đã lưu
                    </AntTag>
                  )}

                  {answers > 0 ? (
                    <AntTag color="green" icon={<CheckCircleOutlined />}>
                      Đã có trả lời
                    </AntTag>
                  ) : (
                    <AntTag>Chưa có trả lời</AntTag>
                  )}
                </Space>

                <Title
                  level={2}
                  style={{
                    color: "#fff",
                    margin: 0,
                    lineHeight: 1.25,
                  }}
                >
                  {question.title}
                </Title>

                <Space
                  size={10}
                  wrap
                  style={{
                    marginTop: 14,
                    color: "rgba(255,255,255,0.88)",
                  }}
                >
                  <Avatar>{question.author?.fullName?.[0] ?? "U"}</Avatar>

                  <span>{question.author?.fullName || "Người dùng"}</span>
                  <span>•</span>
                  <span>{formatDate(question.createdAt)}</span>
                  <span>•</span>
                  <span>
                    <EyeOutlined /> {views} lượt xem
                  </span>
                </Space>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "76px minmax(0, 1fr)",
                  gap: 18,
                  padding: 24,
                }}
              >
                <aside>
                  <Space direction="vertical" align="center" size={10}>
                    <Tooltip title="Like">
                      <Button
                        type={
                          question.votes?.myVote === 1 ? "primary" : "default"
                        }
                        icon={<LikeFilled />}
                        style={voteButtonStyle}
                        onClick={() => void handleVote(1)}
                      />
                    </Tooltip>

                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 900,
                        color: "#1677ff",
                      }}
                    >
                      {likes}
                    </div>

                    <Tooltip title="Dislike">
                      <Button
                        danger={question.votes?.myVote === -1}
                        icon={<DislikeFilled />}
                        style={voteButtonStyle}
                        onClick={() => void handleVote(-1)}
                      />
                    </Tooltip>

                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: "#ff4d4f",
                      }}
                    >
                      {dislikes}
                    </div>
                  </Space>
                </aside>

                <section style={{ minWidth: 0 }}>
                  <div style={{ marginBottom: 16 }}>
                    {question.tags?.map((t) => (
                      <AntTag
                        key={t.id || t.name}
                        style={{
                          borderRadius: 999,
                          padding: "4px 10px",
                          marginBottom: 8,
                        }}
                      >
                        {t.name}
                      </AntTag>
                    ))}
                  </div>

                  <div
                    style={{
                      fontSize: 16,
                      lineHeight: 1.8,
                      color: "#1f2937",
                    }}
                    dangerouslySetInnerHTML={{ __html: question.content }}
                  />

                  <Divider />

                  <Progress
                    percent={likePercent}
                    status={dislikes > likes ? "exception" : "active"}
                  />

                  <Text type="secondary">
                    {likes} Like • {dislikes} Dislike • {answers} trả lời
                  </Text>
                </section>
              </div>
            </Card>

            <Card
              style={{ ...mainCardStyle, marginTop: 18 }}
              styles={{ body: { padding: 22 } }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 16,
                }}
              >
                <div>
                  <Title level={3} style={{ margin: 0 }}>
                    Câu trả lời
                  </Title>

                  <Text type="secondary">
                    Hãy trả lời rõ ràng, có ví dụ hoặc hướng xử lý cụ thể.
                  </Text>
                </div>

                <Space>
                  <Button
                    type={commentSort === "best" ? "primary" : "default"}
                    onClick={() => setCommentSort("best")}
                  >
                    Hay nhất
                  </Button>

                  <Button
                    type={commentSort === "newest" ? "primary" : "default"}
                    onClick={() => setCommentSort("newest")}
                  >
                    Mới nhất
                  </Button>
                </Space>
              </div>

              <TextArea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                placeholder="Viết câu trả lời của bạn..."
                style={{
                  borderRadius: 14,
                  resize: "vertical",
                  marginBottom: 12,
                }}
              />

              <Space wrap style={{ marginBottom: 20 }}>
                <Button
                  onClick={() =>
                    setComment(
                      "Theo mình, vấn đề này nên xử lý theo các bước sau:\n\n1. ...\n2. ...\n3. ...",
                    )
                  }
                >
                  Mẫu trả lời
                </Button>

                <Button
                  onClick={() =>
                    setComment(
                      "Bạn có thể gửi thêm ảnh lỗi hoặc đoạn code liên quan không?",
                    )
                  }
                >
                  Hỏi thêm thông tin
                </Button>

                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={submitting}
                  onClick={() => void handleComment()}
                >
                  Gửi
                </Button>
              </Space>

              {comments.length === 0 ? (
                <Empty description="Chưa có câu trả lời nào" />
              ) : (
                comments.map((c: CommentItem) => (
                  <Card
                    key={c.id}
                    style={commentCardStyle}
                    styles={{ body: { padding: 16 } }}
                  >
                    <Space align="start" style={{ width: "100%" }}>
                      <Avatar>{c.author?.fullName?.[0] ?? "U"}</Avatar>

                      <div style={{ flex: 1 }}>
                        <Space wrap>
                          <Text strong>
                            {c.author?.fullName || "Người dùng"}
                          </Text>

                          <Text type="secondary">
                            {formatDate(c.createdAt)}
                          </Text>

                          {getLikes(c) >= 3 && (
                            <AntTag color="green">Hữu ích</AntTag>
                          )}
                        </Space>

                        <Paragraph
                          style={{
                            marginTop: 10,
                            marginBottom: 10,
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.7,
                          }}
                        >
                          {c.content}
                        </Paragraph>

                        <Space size={16}>
                          <Text type="secondary">
                            <LikeFilled /> {getLikes(c)}
                          </Text>

                          <Text type="secondary">
                            <DislikeFilled /> {getDislikes(c)}
                          </Text>
                        </Space>
                      </div>
                    </Space>
                  </Card>
                ))
              )}
            </Card>
          </main>

          <aside>
            <Card style={sideCardStyle}>
              <Title level={4} style={{ marginTop: 0 }}>
                Thống kê
              </Title>

              <Timeline
                items={[
                  {
                    dot: <LikeFilled style={{ color: "#1677ff" }} />,
                    children: `${likes} lượt thích`,
                  },
                  {
                    dot: <DislikeFilled style={{ color: "#ff4d4f" }} />,
                    children: `${dislikes} lượt không thích`,
                  },
                  {
                    dot: <MessageOutlined style={{ color: "#52c41a" }} />,
                    children: `${answers} câu trả lời`,
                  },
                  {
                    dot: <EyeOutlined style={{ color: "#722ed1" }} />,
                    children: `${views} lượt xem`,
                  },
                ]}
              />
            </Card>

            <Card style={sideCardStyle}>
              <Title level={4} style={{ marginTop: 0 }}>
                Chất lượng vote
              </Title>

              <Progress
                type="circle"
                percent={likePercent}
                status={dislikes > likes ? "exception" : "success"}
              />

              <Paragraph type="secondary" style={{ marginTop: 14 }}>
                Tỷ lệ này được tính theo Like / tổng số Like và Dislike.
              </Paragraph>
            </Card>

            <Card style={sideCardStyle}>
              <Title level={4} style={{ marginTop: 0 }}>
                Gợi ý trả lời hay
              </Title>

              <Space direction="vertical">
                <Text type="secondary">Nêu nguyên nhân có thể xảy ra.</Text>

                <Text type="secondary">Đưa đoạn code hoặc ví dụ cụ thể.</Text>

                <Text type="secondary">Kết luận cách sửa ngắn gọn.</Text>
              </Space>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
