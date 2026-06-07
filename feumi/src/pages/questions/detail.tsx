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
  Divider,
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
  return new Date(date).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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
    <div className={`comment-thread-wrapper level-${level}`}>
      <div className="comment-box">
        <div className="comment-layout">
          <Avatar
            size={40}
            icon={<UserOutlined />}
            className="comment-avatar"
          />
          <div className="comment-content-area">
            <div className="comment-header">
              <Text className="comment-author">
                {node.author?.fullName || "Thành viên"}
              </Text>
              <Text className="comment-date">{formatDate(node.createdAt)}</Text>
            </div>

            <Paragraph className="comment-text">{node.content}</Paragraph>

            <div className="comment-actions">
              <Button
                type="text"
                size="small"
                onClick={() => onOpenReply(node.id)}
                className="btn-reply-trigger"
              >
                Trả lời
              </Button>
            </div>

            {isReplying && (
              <div className="reply-input-box">
                <TextArea
                  autoFocus
                  rows={3}
                  value={replyText}
                  onChange={(e) => onChangeReply(e.target.value)}
                  placeholder={`Phản hồi ${node.author?.fullName || "thành viên"}...`}
                  className="flat-textarea"
                />
                <Space style={{ marginTop: 12 }}>
                  <Button
                    type="primary"
                    loading={submitting}
                    icon={<SendOutlined />}
                    onClick={() => onSubmitReply(node.id)}
                    className="btn-flat-primary"
                  >
                    Gửi
                  </Button>
                  <Button onClick={onCancelReply} className="btn-flat-default">
                    Hủy
                  </Button>
                </Space>
              </div>
            )}
          </div>
        </div>
      </div>

      {node.children.length > 0 && (
        <div className="comment-children">
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
      )}
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
      message.success("Đã gửi phản hồi");
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không gửi được phản hồi");
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
      <div className="center-loader">
        <Spin size="large" />
      </div>
    );
  }

  if (!question) {
    return (
      <Card className="empty-state-card" bordered={false}>
        <Empty description="Không tìm thấy câu hỏi" />
        <Link to="/questions">
          <Button
            type="primary"
            icon={<ArrowLeftOutlined />}
            className="btn-flat-primary mt-4"
          >
            Quay lại danh sách
          </Button>
        </Link>
      </Card>
    );
  }

  const likes = getLikes(question);
  const dislikes = getDislikes(question);
  const answers = question.answersCount ?? question.comments.length;
  const views = question.viewsCount ?? 0;

  return (
    <>
      <style>{`
        :root {
          --c-bg-page: #f8fafc;
          --c-bg-card: #ffffff;
          --c-bg-muted: #f1f5f9;
          --c-border: #e2e8f0;
          --c-text-main: #0f172a;
          --c-text-secondary: #475569;
          --c-text-muted: #64748b;
          --c-primary: #2563eb;
          --c-primary-hover: #1d4ed8;
          --c-primary-light: #eff6ff;
          --c-danger: #dc2626;
          --c-danger-light: #fef2f2;
          --c-warning: #d97706;
          --c-warning-light: #fffbeb;
        }

        .qa-detail-wrapper {
          max-width: 1080px;
          margin: 0 auto;
          padding-bottom: 60px;
        }

        .btn-back {
          color: var(--c-text-secondary);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          margin-bottom: 24px;
          border-radius: 8px;
        }
        .btn-back:hover { color: var(--c-primary); background: transparent !important; }

        /* Card styles */
        .detail-card {
          border-radius: 12px;
          border: 1px solid var(--c-border);
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          background: var(--c-bg-card);
        }
        .detail-card .ant-card-body { padding: 32px 40px; }

        /* Typography */
        .q-title {
          font-size: 28px !important;
          font-weight: 700 !important;
          color: var(--c-text-main) !important;
          line-height: 1.4 !important;
          margin-bottom: 20px !important;
        }

        /* Meta Info */
        .q-meta-bar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 16px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--c-border);
          margin-bottom: 24px;
          color: var(--c-text-secondary);
          font-size: 14px;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .meta-icon { color: var(--c-text-muted); }

        /* Tags */
        .q-tags { margin-bottom: 24px; }
        .detail-tag {
          background: var(--c-bg-muted);
          border: 1px solid var(--c-border);
          color: var(--c-text-secondary);
          border-radius: 6px;
          padding: 2px 12px;
          font-size: 13px;
          font-weight: 500;
        }

        /* Content */
        .q-html-content {
          font-size: 16px;
          line-height: 1.7;
          color: var(--c-text-main);
          margin-bottom: 32px;
        }
        .q-html-content p { margin-bottom: 1em; }
        .q-html-content img { max-width: 100%; border-radius: 8px; }

        /* Action Bar */
        .q-action-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 40px;
        }
        .btn-action {
          border-radius: 8px;
          font-weight: 500;
          color: var(--c-text-secondary);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          border: 1px solid var(--c-border);
          background: var(--c-bg-card);
          transition: all 0.2s;
        }
        .btn-action:hover {
          background: var(--c-bg-muted);
          border-color: #cbd5e1;
        }
        .btn-action.active-like { background: var(--c-primary-light); color: var(--c-primary); border-color: #bfdbfe; }
        .btn-action.active-dislike { background: var(--c-danger-light); color: var(--c-danger); border-color: #fecaca; }
        .btn-action.active-bookmark { background: var(--c-warning-light); color: var(--c-warning); border-color: #fde68a; }

        /* Comments Section */
        .comments-header {
          font-size: 20px !important;
          font-weight: 600 !important;
          margin-bottom: 24px !important;
          padding-top: 24px;
          border-top: 1px solid var(--c-border);
        }

        /* Comment Thread styles */
        .comment-thread-wrapper { margin-bottom: 20px; }
        .comment-children {
          margin-left: 20px;
          padding-left: 20px;
          border-left: 2px solid var(--c-border);
          margin-top: 16px;
        }
        .comment-box { padding: 4px 0; }
        .comment-layout { display: flex; gap: 16px; }
        .comment-avatar { background: var(--c-border); color: var(--c-text-secondary); flex-shrink: 0; }
        .comment-content-area { flex: 1; min-width: 0; }
        
        .comment-header { margin-bottom: 4px; }
        .comment-author { font-weight: 600; font-size: 14px; color: var(--c-text-main); margin-right: 8px; }
        .comment-date { font-size: 13px; color: var(--c-text-muted); }
        
        .comment-text {
          font-size: 15px;
          line-height: 1.6;
          color: var(--c-text-main);
          margin-bottom: 8px !important;
          white-space: pre-wrap;
        }
        
        .btn-reply-trigger {
          color: var(--c-text-muted);
          font-size: 13px;
          font-weight: 500;
          padding: 0;
          height: auto;
        }
        .btn-reply-trigger:hover { color: var(--c-primary); background: transparent; }

        /* Form Inputs & Buttons */
        .reply-input-box {
          margin-top: 12px;
          background: var(--c-bg-muted);
          padding: 16px;
          border-radius: 8px;
        }
        .flat-textarea {
          border-radius: 8px;
          border: 1px solid var(--c-border);
          box-shadow: none !important;
        }
        .flat-textarea:focus { border-color: var(--c-primary); }
        
        .btn-flat-primary {
          border-radius: 8px;
          font-weight: 500;
          background: var(--c-primary);
          box-shadow: none;
        }
        .btn-flat-primary:hover { background: var(--c-primary-hover); }
        .btn-flat-default { border-radius: 8px; font-weight: 500; }

        /* Inline Main Comment Box */
        .main-comment-box {
          margin-top: 32px;
          padding: 24px;
          border: 1px solid var(--c-border);
          border-radius: 12px;
          background: var(--c-bg-muted);
        }

        .center-loader { display: flex; justify-content: center; align-items: center; min-height: 400px; }
        .empty-state-card { border-radius: 12px; text-align: center; padding: 60px 24px; border: 1px solid var(--c-border); }
        .mt-4 { margin-top: 16px; }
      `}</style>

      <div className="qa-detail-wrapper">
        <Link to="/questions">
          <Button type="text" icon={<ArrowLeftOutlined />} className="btn-back">
            Quay lại danh sách
          </Button>
        </Link>

        <Card className="detail-card" bordered={false}>
          <Title level={1} className="q-title">
            {question.title}
          </Title>

          <div className="q-meta-bar">
            <span className="meta-item">
              <UserOutlined className="meta-icon" />
              {question.author?.fullName || "Thành viên"}
            </span>
            <Divider type="vertical" />
            <span className="meta-item">
              <ClockCircleOutlined className="meta-icon" />
              {formatDate(question.createdAt)}
            </span>
            <Divider type="vertical" />
            <span className="meta-item">
              <EyeOutlined className="meta-icon" />
              {views} lượt xem
            </span>
            <Divider type="vertical" />
            <span className="meta-item">
              <MessageOutlined className="meta-icon" />
              {answers} trả lời
            </span>
          </div>

          <div className="q-tags">
            <Space wrap size={[8, 8]}>
              {question.tags?.map((t) => (
                <Tag
                  key={t.id || t.name}
                  className="detail-tag"
                  bordered={false}
                >
                  {t.name}
                </Tag>
              ))}
            </Space>
          </div>

          <div
            className="q-html-content"
            dangerouslySetInnerHTML={{ __html: question.content }}
          />

          <div className="q-action-bar">
            <Button
              className={`btn-action ${question.votes?.myVote === 1 ? "active-like" : ""}`}
              icon={<LikeOutlined />}
              onClick={() => void handleQuestionVote(1)}
            >
              Thích {likes > 0 && `(${likes})`}
            </Button>

            <Button
              className={`btn-action ${question.votes?.myVote === -1 ? "active-dislike" : ""}`}
              icon={<DislikeOutlined />}
              onClick={() => void handleQuestionVote(-1)}
            >
              Không thích {dislikes > 0 && `(${dislikes})`}
            </Button>

            <Button
              className="btn-action"
              icon={<MessageOutlined />}
              onClick={handleOpenInlineComment}
            >
              Bình luận {answers > 0 && `(${answers})`}
            </Button>

            <Button
              className="btn-action"
              icon={<ShareAltOutlined />}
              onClick={() => void handleCopy()}
            >
              Chia sẻ
            </Button>

            <Button
              className={`btn-action ${question.isBookmarked ? "active-bookmark" : ""}`}
              icon={question.isBookmarked ? <StarFilled /> : <BookOutlined />}
              onClick={() => void handleBookmark()}
            >
              {question.isBookmarked ? "Đã lưu" : "Lưu"}
            </Button>
          </div>

          <Title level={3} className="comments-header">
            {answers} câu trả lời
          </Title>

          {commentTree.length === 0 ? (
            <Empty
              description="Chưa có bình luận nào. Hãy là người đầu tiên bình luận!"
              style={{ padding: "40px 0" }}
            />
          ) : (
            <div>
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

          {showInlineCommentBox && (
            <div ref={commentBoxRef} className="main-comment-box">
              <div className="comment-layout">
                <Avatar
                  size={40}
                  icon={<UserOutlined />}
                  className="comment-avatar"
                />
                <div style={{ flex: 1 }}>
                  <Text
                    strong
                    style={{ fontSize: 15, color: "var(--c-text-main)" }}
                  >
                    Viết bình luận của bạn
                  </Text>
                  <TextArea
                    ref={commentInputRef}
                    rows={4}
                    value={inlineCommentText}
                    onChange={(e) => setInlineCommentText(e.target.value)}
                    placeholder="Chia sẻ suy nghĩ của bạn về câu hỏi này..."
                    className="flat-textarea"
                    style={{ marginTop: 12 }}
                  />
                  <Space
                    style={{
                      marginTop: 16,
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <Button
                      onClick={handleCancelInlineComment}
                      className="btn-flat-default"
                    >
                      Hủy
                    </Button>
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      loading={inlineSubmitting}
                      onClick={() => void handleSubmitInlineComment()}
                      className="btn-flat-primary"
                    >
                      Gửi bình luận
                    </Button>
                  </Space>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
