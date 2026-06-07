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
  DislikeOutlined,
  EyeOutlined,
  LikeOutlined,
  MessageOutlined,
  SendOutlined,
  ShareAltOutlined,
  StarFilled,
  ArrowLeftOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "umi";
import type { CommentItem, QuestionDetail } from "../../models/qa";
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
        marginLeft: level === 0 ? 0 : 56,
        position: "relative",
      }}
    >
      {level > 0 && (
        <div
          style={{
            position: "absolute",
            left: -28,
            top: 24,
            bottom: 24,
            width: 2,
            background:
              "linear-gradient(180deg, #e0e7ff 0%, #c7d2fe 50%, #e0e7ff 100%)",
            borderRadius: 1,
            opacity: 0.7,
          }}
        />
      )}
      <div style={{ padding: "16px 0" }}>
        <div style={{ display: "flex", gap: 16 }}>
          <Avatar
            size={44}
            icon={<UserOutlined />}
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              color: "#fff",
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
              border: "2px solid #ffffff",
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 10,
              }}
            >
              <div>
                <Text strong style={{ fontSize: 15, color: "#1e293b" }}>
                  {node.author?.fullName || "Người dùng"}
                </Text>
                <Text
                  style={{ fontSize: 13, marginLeft: 12, color: "#94a3b8" }}
                >
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {formatDate(node.createdAt)}
                </Text>
              </div>
            </div>
            <div
              style={{
                background: "#f8fafc",
                borderRadius: 16,
                padding: "16px 20px",
                border: "1px solid #f1f5f9",
                transition: "all 0.2s",
              }}
            >
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
                  color: "#6366f1",
                  fontWeight: 600,
                  padding: "0 4px",
                  height: "auto",
                  fontSize: 13,
                  borderRadius: 8,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                <MessageOutlined style={{ marginRight: 6 }} />
                Trả lời
              </Button>
            </div>

            {isReplying && (
              <div
                style={{
                  marginTop: 16,
                  background: "#ffffff",
                  borderRadius: 16,
                  padding: 20,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
                }}
              >
                <TextArea
                  autoFocus
                  rows={3}
                  value={replyText}
                  onChange={(e) => onChangeReply(e.target.value)}
                  placeholder={`Phản hồi ${node.author?.fullName || "người dùng"}...`}
                  style={{
                    borderRadius: 12,
                    marginBottom: 16,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                    padding: 12,
                  }}
                />
                <Space>
                  <Button
                    type="primary"
                    size="middle"
                    loading={submitting}
                    icon={<SendOutlined />}
                    onClick={() => onSubmitReply(node.id)}
                    style={{
                      borderRadius: 12,
                      fontWeight: 600,
                      background:
                        "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                    }}
                  >
                    Gửi
                  </Button>
                  <Button
                    size="middle"
                    onClick={onCancelReply}
                    style={{ borderRadius: 12, fontWeight: 500 }}
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

export default function QuestionDetailPage() {
  const { id = "" } = useParams();
  const { message } = App.useApp();
  const viewedRef = useRef<string | null>(null);
  const commentBoxRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<any>(null);

  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showInlineCommentBox, setShowInlineCommentBox] = useState(false);
  const [inlineCommentText, setInlineCommentText] = useState("");
  const [inlineSubmitting, setInlineSubmitting] = useState(false);

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

  const handleOpenInlineComment = () => {
    setShowInlineCommentBox(true);
    setTimeout(() => {
      commentInputRef.current?.focus();
      commentBoxRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  const handleSubmitInlineComment = async () => {
    if (!question || !inlineCommentText.trim()) return;
    setInlineSubmitting(true);
    try {
      const created = await questionsService.addComment(question.id, {
        content: inlineCommentText.trim(),
      });
      setQuestion({
        ...question,
        comments: [...question.comments, created],
        answersCount: (question.answersCount ?? question.comments.length) + 1,
      });
      setInlineCommentText("");
      setShowInlineCommentBox(false);
      message.success("Đã gửi bình luận");
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không gửi được bình luận");
    } finally {
      setInlineSubmitting(false);
    }
  };

  const handleCancelInlineComment = () => {
    setShowInlineCommentBox(false);
    setInlineCommentText("");
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f0f4ff 0%, #e2e8f0 100%)",
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
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f9faff 0%, #f1f5f9 100%)",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(20px)",
          background: "rgba(255,255,255,0.8)",
          borderBottom: "1px solid rgba(226, 232, 240, 0.6)",
          padding: "0 48px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 8px rgba(0,0,0,0.02)",
        }}
      >
        <Link to="/questions">
          <Button
            type="text"
            icon={<ArrowLeftOutlined style={{ fontSize: 18 }} />}
            style={{
              fontWeight: 600,
              color: "#475569",
              borderRadius: 12,
              padding: "4px 16px",
              height: 40,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              transition: "all 0.2s",
            }}
          >
            Quay lại
          </Button>
        </Link>
        <div style={{ fontWeight: 700, fontSize: 18, color: "#1e293b" }}>
          Chi tiết câu hỏi
        </div>
        <div style={{ width: 100 }} />
      </header>

      <main
        style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px 80px" }}
      >
        <Card
          style={{
            borderRadius: 32,
            boxShadow: "0 25px 80px -20px rgba(0,0,0,0.1)",
            background: "#ffffff",
            border: "1px solid #f1f5f9",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "48px 56px" }}>
            <Title
              level={1}
              style={{
                marginBottom: 28,
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.04em",
                fontSize: 34,
                lineHeight: 1.2,
              }}
            >
              {question.title}
            </Title>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 16,
                marginBottom: 28,
                color: "#475569",
                fontSize: 15,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#f1f5f9",
                  borderRadius: 30,
                  padding: "8px 18px",
                  fontWeight: 500,
                  fontSize: 15,
                }}
              >
                <UserOutlined style={{ color: "#6366f1", fontSize: 16 }} />
                {question.author?.fullName || "Thành viên"}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#f1f5f9",
                  borderRadius: 30,
                  padding: "8px 18px",
                  fontWeight: 500,
                  fontSize: 15,
                }}
              >
                <ClockCircleOutlined
                  style={{ color: "#6366f1", fontSize: 16 }}
                />
                {formatDate(question.createdAt)}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#f1f5f9",
                  borderRadius: 30,
                  padding: "8px 18px",
                  fontWeight: 500,
                  fontSize: 15,
                }}
              >
                <EyeOutlined style={{ color: "#6366f1", fontSize: 16 }} />
                {views} lượt xem
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#f1f5f9",
                  borderRadius: 30,
                  padding: "8px 18px",
                  fontWeight: 500,
                  fontSize: 15,
                }}
              >
                <MessageOutlined style={{ color: "#6366f1", fontSize: 16 }} />
                {answers} trả lời
              </div>
            </div>

            <div style={{ marginBottom: 32 }}>
              <Space wrap size={[8, 12]}>
                {question.tags?.map((t) => (
                  <Tag
                    key={t.id || t.name}
                    style={{
                      background:
                        "linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%)",
                      border: "none",
                      borderRadius: 30,
                      padding: "6px 20px",
                      fontSize: 14,
                      color: "#4c1d95",
                      fontWeight: 600,
                      cursor: "default",
                      boxShadow: "0 2px 6px rgba(139, 92, 246, 0.15)",
                    }}
                  >
                    {t.name}
                  </Tag>
                ))}
              </Space>
            </div>

            <div
              style={{
                background: "#fafbff",
                borderRadius: 20,
                padding: "32px 36px",
                marginBottom: 36,
                fontSize: 16,
                lineHeight: 1.85,
                color: "#1e293b",
                border: "1px solid #eef2ff",
                boxShadow: "inset 0 2px 10px rgba(0,0,0,0.02)",
              }}
              dangerouslySetInnerHTML={{ __html: question.content }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-around",
                padding: "12px 0",
                borderTop: "1px solid #f1f5f9",
                borderBottom: "1px solid #f1f5f9",
                marginBottom: 48,
              }}
            >
              <Tooltip title="Thích">
                <Button
                  type="text"
                  icon={<LikeOutlined style={{ fontSize: 20 }} />}
                  onClick={() => void handleQuestionVote(1)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontWeight: 600,
                    fontSize: 15,
                    color: question.votes?.myVote === 1 ? "#4f46e5" : "#475569",
                    background: "transparent",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: 8,
                    transition: "all 0.2s",
                  }}
                >
                  Thích {likes > 0 && `(${likes})`}
                </Button>
              </Tooltip>

              <Tooltip title="Không thích">
                <Button
                  type="text"
                  icon={<DislikeOutlined style={{ fontSize: 20 }} />}
                  onClick={() => void handleQuestionVote(-1)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontWeight: 600,
                    fontSize: 15,
                    color:
                      question.votes?.myVote === -1 ? "#dc2626" : "#475569",
                    background: "transparent",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: 8,
                    transition: "all 0.2s",
                  }}
                >
                  Không thích {dislikes > 0 && `(${dislikes})`}
                </Button>
              </Tooltip>

              <Tooltip title="Bình luận">
                <Button
                  type="text"
                  icon={<MessageOutlined style={{ fontSize: 20 }} />}
                  onClick={handleOpenInlineComment}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontWeight: 600,
                    fontSize: 15,
                    color: "#475569",
                    background: "transparent",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: 8,
                    transition: "all 0.2s",
                  }}
                >
                  Bình luận {answers > 0 && `(${answers})`}
                </Button>
              </Tooltip>

              <Tooltip title="Chia sẻ liên kết">
                <Button
                  type="text"
                  icon={<ShareAltOutlined style={{ fontSize: 20 }} />}
                  onClick={() => void handleCopy()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontWeight: 600,
                    fontSize: 15,
                    color: "#475569",
                    background: "transparent",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: 8,
                    transition: "all 0.2s",
                  }}
                >
                  Chia sẻ
                </Button>
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
                  onClick={() => void handleBookmark()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontWeight: 600,
                    fontSize: 15,
                    color: question.isBookmarked ? "#f59e0b" : "#475569",
                    background: "transparent",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: 8,
                    transition: "all 0.2s",
                  }}
                >
                  {question.isBookmarked ? "Đã lưu" : "Lưu"}
                </Button>
              </Tooltip>
            </div>

            <Title
              level={3}
              style={{
                marginBottom: 32,
                fontWeight: 700,
                color: "#0f172a",
                fontSize: 24,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <MessageOutlined style={{ color: "#6366f1" }} />
              {answers} câu trả lời
            </Title>

            {commentTree.length === 0 ? (
              <div style={{ textAlign: "center", padding: "56px 0" }}>
                <Empty description="Chưa có bình luận nào. Hãy là người đầu tiên bình luận!" />
              </div>
            ) : (
              <div style={{ marginBottom: 32 }}>
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

            {/* Inline Comment Box - Chuyên nghiệp, xuất hiện khi nhấn nút Bình luận */}
            {showInlineCommentBox && (
              <div
                ref={commentBoxRef}
                style={{
                  marginTop: 24,
                  marginBottom: 24,
                  background: "#ffffff",
                  borderRadius: 24,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 20px 35px -12px rgba(0,0,0,0.1)",
                  padding: 24,
                  animation: "fadeInUp 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1)",
                }}
              >
                <div style={{ display: "flex", gap: 16 }}>
                  <Avatar
                    size={44}
                    icon={<UserOutlined />}
                    style={{
                      background:
                        "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: 16 }}>
                      Viết bình luận
                    </Text>
                    <TextArea
                      ref={commentInputRef}
                      rows={4}
                      value={inlineCommentText}
                      onChange={(e) => setInlineCommentText(e.target.value)}
                      placeholder="Chia sẻ suy nghĩ của bạn về câu hỏi này..."
                      style={{
                        marginTop: 12,
                        borderRadius: 16,
                        border: "1px solid #e2e8f0",
                        fontSize: 15,
                        padding: 12,
                        resize: "vertical",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 12,
                        marginTop: 16,
                      }}
                    >
                      <Button
                        onClick={handleCancelInlineComment}
                        style={{ borderRadius: 40, fontWeight: 500 }}
                      >
                        Hủy
                      </Button>
                      <Button
                        type="primary"
                        icon={<SendOutlined />}
                        loading={inlineSubmitting}
                        onClick={() => void handleSubmitInlineComment()}
                        style={{
                          borderRadius: 40,
                          fontWeight: 600,
                          paddingLeft: 24,
                          paddingRight: 24,
                          background:
                            "linear-gradient(135deg, #6366f1, #4f46e5)",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                        }}
                      >
                        Gửi bình luận
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </main>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
