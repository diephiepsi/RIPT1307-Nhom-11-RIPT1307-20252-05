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
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { CommentItem, QuestionDetail } from "../../models/qa";
import { questionsService } from "../../services/questions";
import "./QuestionList.css";

const getLikes = (x?: { likesCount?: number; votes?: any }) =>
  x?.likesCount ?? x?.votes?.likesCount ?? x?.votes?.up ?? 0;
const getDislikes = (x?: { dislikesCount?: number; votes?: any }) =>
  x?.dislikesCount ?? x?.votes?.dislikesCount ?? x?.votes?.down ?? 0;
const formatDate = (date?: string) =>
  date ? new Date(date).toLocaleString("vi-VN") : "";

export function QuestionDetailPage() {
  const { id = "" } = useParams();
  const { message } = App.useApp();
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
    if (id) void questionsService.view(id).catch(() => void 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const comments = useMemo(() => {
    const list = [...(question?.comments ?? [])];
    if (commentSort === "newest")
      return list.sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      );
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
      setQuestion({ ...question, isBookmarked: res.isBookmarked });
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

  if (loading)
    return (
      <div className="qa-center">
        <Spin />
      </div>
    );
  if (!question) return <Empty description="Không tìm thấy câu hỏi" />;

  const likes = getLikes(question);
  const dislikes = getDislikes(question);
  const totalVotes = Math.max(1, likes + dislikes);
  const likePercent = Math.round((likes / totalVotes) * 100);

  return (
    <div className="qa-page-shell">
      <div className="qa-detail-layout">
        <main className="qa-main">
          <Card className="qa-detail-card">
            <Space className="qa-detail-top" align="start">
              <div className="qa-detail-votes">
                <Tooltip title="Like câu hỏi">
                  <Button
                    size="large"
                    shape="circle"
                    icon={<LikeFilled />}
                    type={question.votes?.myVote === 1 ? "primary" : "default"}
                    onClick={() => void handleVote(1)}
                  />
                </Tooltip>
                <div className="qa-detail-count like">
                  <LikeFilled /> {likes}
                </div>
                <Tooltip title="Dislike câu hỏi">
                  <Button
                    size="large"
                    shape="circle"
                    danger={question.votes?.myVote === -1}
                    icon={<DislikeFilled />}
                    onClick={() => void handleVote(-1)}
                  />
                </Tooltip>
                <div className="qa-detail-count dislike">
                  <DislikeFilled /> {dislikes}
                </div>
              </div>

              <div className="qa-detail-body">
                <div className="qa-kicker">
                  <MessageOutlined /> Chi tiết câu hỏi
                </div>
                <Typography.Title level={2} className="qa-detail-title">
                  {question.title}
                </Typography.Title>
                <div className="qa-meta big">
                  <Avatar>{question.author?.fullName?.[0] ?? "U"}</Avatar>
                  <span>{question.author?.fullName}</span>
                  <span>•</span>
                  <span>{formatDate(question.createdAt)}</span>
                  <span>•</span>
                  <EyeOutlined />{" "}
                  <span>{question.viewsCount ?? 0} lượt xem</span>
                </div>

                <div className="qa-tags detail">
                  {question.tags?.map((t) => (
                    <AntTag key={t.id || t.name}>{t.name}</AntTag>
                  ))}
                </div>

                <div
                  className="qa-content"
                  dangerouslySetInnerHTML={{ __html: question.content }}
                />

                <Progress
                  percent={likePercent}
                  status={dislikes > likes ? "exception" : "active"}
                />
                <div className="qa-vote-note">
                  👍 {likes} Like • 👎 {dislikes} Dislike
                </div>

                <Space wrap className="qa-actions">
                  <Button
                    icon={
                      question.isBookmarked ? <StarFilled /> : <BookOutlined />
                    }
                    type={question.isBookmarked ? "primary" : "default"}
                    onClick={() => void handleBookmark()}
                  >
                    {question.isBookmarked ? "Đã lưu" : "Lưu câu hỏi"}
                  </Button>
                  <Button
                    icon={<CopyOutlined />}
                    onClick={() => void handleCopy()}
                  >
                    Copy link
                  </Button>
                  <Link to="/questions">
                    <Button>Về danh sách</Button>
                  </Link>
                </Space>
              </div>
            </Space>
          </Card>

          <Card
            className="qa-comment-box"
            title={`Câu trả lời / bình luận (${comments.length})`}
            extra={
              <Space>
                <Button
                  size="small"
                  type={commentSort === "best" ? "primary" : "default"}
                  onClick={() => setCommentSort("best")}
                >
                  Hay nhất
                </Button>
                <Button
                  size="small"
                  type={commentSort === "newest" ? "primary" : "default"}
                  onClick={() => setCommentSort("newest")}
                >
                  Mới nhất
                </Button>
              </Space>
            }
          >
            <Input.TextArea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Viết câu trả lời rõ ràng, có ví dụ hoặc hướng giải quyết..."
            />
            <div className="qa-comment-actions">
              <Space wrap>
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
              </Space>
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={submitting}
                onClick={() => void handleComment()}
              >
                Gửi
              </Button>
            </div>

            <Divider />
            {comments.length === 0 ? (
              <Empty description="Chưa có bình luận" />
            ) : (
              comments.map((c: CommentItem) => (
                <div className="qa-comment" key={c.id}>
                  <Avatar>{c.author?.fullName?.[0] ?? "U"}</Avatar>
                  <div className="qa-comment-content">
                    <div className="qa-comment-head">
                      <b>{c.author?.fullName}</b>
                      <span>{formatDate(c.createdAt)}</span>
                      {getLikes(c) >= 3 && (
                        <AntTag color="green">
                          <CheckCircleOutlined /> hữu ích
                        </AntTag>
                      )}
                    </div>
                    <div className="qa-comment-text">{c.content}</div>
                    <Space className="qa-comment-votes">
                      <span>
                        <LikeFilled /> {getLikes(c)}
                      </span>
                      <span>
                        <DislikeFilled /> {getDislikes(c)}
                      </span>
                    </Space>
                  </div>
                </div>
              ))
            )}
          </Card>
        </main>

        <aside className="qa-sidebar">
          <Card className="qa-side-card" title="Tổng quan">
            <Timeline
              items={[
                {
                  color: "blue",
                  children: `Tạo lúc ${formatDate(question.createdAt)}`,
                },
                { color: "green", children: `${likes} Like thật từ backend` },
                {
                  color: "red",
                  children: `${dislikes} Dislike thật từ backend`,
                },
                { color: "purple", children: `${comments.length} bình luận` },
                {
                  color: "gray",
                  children: `${question.viewsCount ?? 0} lượt xem`,
                },
              ]}
            />
          </Card>
        </aside>
      </div>
    </div>
  );
}
