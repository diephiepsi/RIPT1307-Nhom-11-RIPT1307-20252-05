import {
  App,
  Avatar,
  Button,
  Card,
  Empty,
  Input,
  Space,
  Spin,
  Tag,
  Typography,
  Tooltip,
} from "antd";
import {
  BookOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  DislikeOutlined,
  EyeOutlined,
  LikeOutlined,
  MessageOutlined,
  SendOutlined,
  StarFilled,
  ArrowLeftOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, useRef, useState } from "react";
// Đã sửa 1: Import Link và useParams từ 'umi' thay vì 'react-router-dom'
import { Link, useParams } from "umi"; 
// Đã sửa 2: Đổi đường dẫn models thành types
import type { CommentItem, QuestionDetail } from "../../types/qa"; 
import { questionsService } from "../../services/questions";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

type CommentNode = CommentItem & {
  children: CommentNode[];
};

const getLikes = (x?: { likesCount?: number; votes?: any }) =>
  x?.likesCount ?? x?.votes?.likesCount ?? x?.votes?.up ?? 0;

const getDislikes = (x?: { dislikesCount?: number; votes?: any }) =>
  x?.dislikesCount ?? x?.votes?.dislikesCount ?? x?.votes?.down ?? 0;

const formatDate = (date?: string) => {
  if (!date) return "";
  return new Date(date).toLocaleString("vi-VN");
};

const buildCommentTree = (comments: CommentItem[]): CommentNode[] => {
  const map = new Map<string, CommentNode>();
  comments.forEach((comment) => {
    map.set(comment.id, { ...comment, children: [] });
  });
  const roots: CommentNode[] = [];
  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortTree = (nodes: CommentNode[]) => {
    nodes.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    nodes.forEach((node) => sortTree(node.children));
  };
  sortTree(roots);
  return roots;
};

function CommentThread({
  node,
  level = 0,
  replyingId,
  replyText,
  submitting,
  onOpenReply,
  onChangeReply,
  onSubmitReply,
  onCancelReply,
}: {
  node: CommentNode;
  level?: number;
  replyingId: string | null;
  replyText: string;
  submitting: boolean;
  onOpenReply: (id: string) => void;
  onChangeReply: (value: string) => void;
  onSubmitReply: (parentId: string) => void;
  onCancelReply: () => void;
}) {
  const isReplying = replyingId === node.id;

  return (
    <div
      style={{
        marginTop: level === 0 ? 0 : 24,
        marginLeft: level === 0 ? 0 : 48,
        position: "relative",
      }}
    >
      {level > 0 && (
        <div
          style={{
            position: "absolute",
            left: -24,
            top: 0,
            bottom: 0,
            width: 2,
            background: "linear-gradient(180deg, #e2e8f0 0%, #f1f5f9 100%)",
            borderRadius: 1,
          }}
        />
      )}
      <div style={{ padding: "16px 0" }}>
        <div style={{ display: "flex", gap: 16 }}>
          <Avatar
            size={40}
            icon={<UserOutlined />}
            style={{
              background: "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)",
              color: "#475569",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 8,
              }}
            >
              <div>
                <Text strong style={{ fontSize: 15, color: "#1a2332" }}>
                  {node.author?.fullName || "Người dùng"}
                </Text>
                <Text type="secondary" style={{ fontSize: 13, marginLeft: 12 }}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {formatDate(node.createdAt)}
                </Text>
              </div>
            </div>
            <Paragraph
              style={{
                whiteSpace: "pre-wrap",
                fontSize: 15,
                lineHeight: 1.7,
                color: "#334155",
                marginBottom: 12,
              }}
            >
              {node.content}
            </Paragraph>
            <Button
              type="text"
              size="small"
              onClick={() => onOpenReply(node.id)}
              style={{
                color: "#2563eb",
                fontWeight: 600,
                padding: "0 4px",
                height: "auto",
                fontSize: 13,
                transition: "all 0.2s",
                borderRadius: 6,
              }}
            >
              <MessageOutlined style={{ marginRight: 4 }} />
              Trả lời
            </Button>
            {isReplying && (
              <div
                style={{
                  marginTop: 16,
                  background: "#ffffff",
                  borderRadius: 12,
                  padding: 16,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                }}
              >
                <TextArea
                  autoFocus
                  rows={3}
                  value={replyText}
                  onChange={(e) => onChangeReply(e.target.value)}
                  placeholder={`Phản hồi ${node.author?.fullName || "người dùng"}...`}
                  style={{
                    borderRadius: 8,
                    marginBottom: 12,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                  }}
                />
                <Space>
                  <Button
                    type="primary"
                    size="small"
                    loading={submitting}
                    icon={<SendOutlined />}
                    onClick={() => onSubmitReply(node.id)}
                    style={{
                      borderRadius: 8,
                      fontWeight: 600,
                      boxShadow: "0 2px 8px rgba(37,99,235,0.2)",
                    }}
                  >
                    Gửi
                  </Button>
                  <Button
                    size="small"
                    onClick={onCancelReply}
                    style={{ borderRadius: 8 }}
                  >
                    Hủy
                  </Button>
                </Space>
              </div>
            )}
          </div>
        </div>
      </div>
      {node.children.map((child) => (
        <CommentThread
          key={child.id}
          node={child}
          level={level + 1}
          replyingId={replyingId}
          replyText={replyText}
          submitting={submitting}
          onOpenReply={onOpenReply}
          onChangeReply={onChangeReply}
          onSubmitReply={onSubmitReply}
          onCancelReply={onCancelReply}
        />
      ))}
    </div>
  );
}

// Đã sửa 3: Thêm default export
export default function QuestionDetailPage() {
  const { id = "" } = useParams<{ id: string }>(); // Bắt ID từ UmiJS Router
  const { message } = App.useApp();
  const viewedRef = useRef<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
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
    if (id && viewedRef.current !== id) {
      viewedRef.current = id;
      void questionsService.view(id).catch(() => void 0);
    }
  }, [id]);

  const commentTree = useMemo(() => {
    return buildCommentTree(question?.comments ?? []);
  }, [question?.comments]);

  const handleQuestionVote = async (value: -1 | 0 | 1) => {
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
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không vote được câu hỏi");
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
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không lưu được câu hỏi");
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    message.success("Đã sao chép liên kết");
  };

  const submitAnswer = async () => {
    if (!question || !answerText.trim()) return;
    setSubmitting(true);
    try {
      const created = await questionsService.addComment(question.id, {
        content: answerText.trim(),
      });
      setQuestion({
        ...question,
        comments: [...question.comments, created],
        answersCount: (question.answersCount ?? question.comments.length) + 1,
      });
      setAnswerText("");
      message.success("Đã gửi câu trả lời");
    } catch (err: any) {
      message.error(
        err?.response?.data?.message || "Không gửi được câu trả lời",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async (parentId: string) => {
    if (!question || !replyText.trim()) return;
    setSubmitting(true);
    try {
      const created = await questionsService.addComment(question.id, {
        content: replyText.trim(),
        parentId,
      });
      setQuestion({
        ...question,
        comments: [...question.comments, created],
        answersCount: (question.answersCount ?? question.comments.length) + 1,
      });
      setReplyingId(null);
      setReplyText("");
      message.success("Đã trả lời bình luận");
    } catch (err: any) {
      message.error(
        err?.response?.data?.message || "Không trả lời được bình luận",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!question) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 24 }}>
        <Card
          style={{
            maxWidth: 600,
            margin: "0 auto",
            textAlign: "center",
            borderRadius: 24,
          }}
        >
          <Empty description="Không tìm thấy câu hỏi" />
          <Link to="/questions">← Quay lại danh sách</Link>
        </Card>
      </div>
    );
  }

  const likes = getLikes(question);
  const dislikes = getDislikes(question);
  const answers = question.answersCount ?? question.comments.length;
  const views = question.viewsCount ?? 0;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "blur(12px)",
          background: "rgba(255,255,255,0.85)",
          borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
          padding: "12px 32px",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <Link to="/questions">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            style={{ fontWeight: 600, color: "#334155", borderRadius: 8 }}
          >
            Quay lại
          </Button>
        </Link>
      </header>

      <main
        style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 80px" }}
      >
        <Card
          style={{
            borderRadius: 28,
            border: "none",
            boxShadow: "0 20px 60px -20px rgba(0,0,0,0.1)",
            background: "#ffffff",
            overflow: "hidden",
          }}
          bodyStyle={{ padding: "48px 56px" }}
        >
          <Title
            level={1}
            style={{
              marginBottom: 24,
              fontWeight: 700,
              color: "#0f172a",
              letterSpacing: "-0.03em",
              fontSize: 34,
              lineHeight: 1.25,
            }}
          >
            {question.title}
          </Title>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 24,
              marginBottom: 24,
              color: "#64748b",
              fontSize: 15,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <UserOutlined style={{ color: "#2563eb" }} />
              {question.author?.fullName || "Thành viên"}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ClockCircleOutlined style={{ color: "#2563eb" }} />
              {formatDate(question.createdAt)}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <EyeOutlined style={{ color: "#2563eb" }} />
              {views} lượt xem
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MessageOutlined style={{ color: "#2563eb" }} />
              {answers} trả lời
            </span>
          </div>

          <div style={{ marginBottom: 32 }}>
            <Space wrap size={[8, 12]}>
              {question.tags?.map((t) => (
                <Tag
                  key={t.id || t.name}
                  style={{
                    background: "#eff6ff",
                    border: "1px solid #dbeafe",
                    borderRadius: 40,
                    padding: "6px 20px",
                    fontSize: 13,
                    color: "#1d4ed8",
                    fontWeight: 600,
                    cursor: "default",
                    transition: "all 0.2s",
                  }}
                >
                  {t.name}
                </Tag>
              ))}
            </Space>
          </div>

          <div
            style={{
              background: "#f9fafb",
              borderRadius: 18,
              padding: "28px 32px",
              marginBottom: 32,
              border: "1px solid #eef2f6",
              fontSize: 17,
              lineHeight: 1.85,
              color: "#1e293b",
            }}
            dangerouslySetInnerHTML={{ __html: question.content }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "18px 0",
              borderTop: "1px solid #f1f5f9",
              borderBottom: "1px solid #f1f5f9",
              marginBottom: 48,
            }}
          >
            <Button
              type={question.votes?.myVote === 1 ? "primary" : "default"}
              icon={<LikeOutlined />}
              onClick={() => void handleQuestionVote(1)}
              size="large"
              style={{
                fontWeight: 600,
                borderRadius: 12,
                padding: "6px 20px",
              }}
            >
              {likes}
            </Button>
            <Button
              type={question.votes?.myVote === -1 ? "primary" : "default"}
              icon={<DislikeOutlined />}
              onClick={() => void handleQuestionVote(-1)}
              size="large"
              danger={question.votes?.myVote === -1}
              style={{
                fontWeight: 600,
                borderRadius: 12,
                padding: "6px 20px",
              }}
            >
              {dislikes}
            </Button>

            <Tooltip title="Sao chép liên kết">
              <Button
                type="text"
                icon={<CopyOutlined style={{ fontSize: 20 }} />}
                size="large"
                onClick={() => void handleCopy()}
                style={{
                  color: "#475569",
                  borderRadius: 12,
                  marginLeft: 8,
                }}
              />
            </Tooltip>

            <Tooltip title={question.isBookmarked ? "Bỏ lưu" : "Lưu"}>
              <Button
                type="text"
                icon={
                  question.isBookmarked ? (
                    <StarFilled style={{ color: "#f59e0b", fontSize: 20 }} />
                  ) : (
                    <BookOutlined style={{ fontSize: 20 }} />
                  )
                }
                size="large"
                onClick={() => void handleBookmark()}
                style={{
                  color: "#475569",
                  borderRadius: 12,
                }}
              />
            </Tooltip>
          </div>

          <Title
            level={3}
            style={{ marginBottom: 28, fontWeight: 700, color: "#0f172a" }}
          >
            {answers} câu trả lời
          </Title>

          {commentTree.length === 0 ? (
            <div style={{ textAlign: "center", padding: "56px 0" }}>
              <Empty description="Chưa có câu trả lời nào. Hãy là người đầu tiên chia sẻ!" />
            </div>
          ) : (
            <div style={{ marginBottom: 56 }}>
              {commentTree.map((node) => (
                <CommentThread
                  key={node.id}
                  node={node}
                  replyingId={replyingId}
                  replyText={replyText}
                  submitting={submitting}
                  onOpenReply={(commentId) => {
                    setReplyingId(commentId);
                    setReplyText("");
                  }}
                  onChangeReply={setReplyText}
                  onSubmitReply={(parentId) => void submitReply(parentId)}
                  onCancelReply={() => {
                    setReplyingId(null);
                    setReplyText("");
                  }}
                />
              ))}
            </div>
          )}

          <div
            style={{
              background: "linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)",
              borderRadius: 20,
              padding: 32,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
            }}
          >
            <Title
              level={4}
              style={{ marginTop: 0, fontWeight: 700, color: "#1e293b" }}
            >
              Viết câu trả lời của bạn
            </Title>
            <TextArea
              rows={5}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Chia sẻ kiến thức, kinh nghiệm hoặc góc nhìn của bạn..."
              style={{
                borderRadius: 14,
                border: "1px solid #cbd5e1",
                marginBottom: 24,
                fontSize: 16,
                padding: 16,
                resize: "vertical",
              }}
            />
            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              loading={submitting}
              onClick={() => void submitAnswer()}
              style={{
                borderRadius: 14,
                fontWeight: 700,
                paddingLeft: 32,
                paddingRight: 32,
                height: 48,
                background: "linear-gradient(105deg, #2563eb, #1d4ed8)",
                border: "none",
                boxShadow: "0 8px 20px -6px rgba(37,99,235,0.4)",
              }}
            >
              Gửi câu trả lời
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}