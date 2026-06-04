import {
  App,

  Card,
  Input,
  Select,
  Space,
  Tag as AntTag,
  Typography,
  Button,
  Spin,
} from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { QuestionListItem, Tag } from "../../models/qa";
import { questionsService } from "../../services/questions";


export function QuestionsPage() {
  const { message } = App.useApp();
  const nav = useNavigate();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<QuestionListItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState("recent");
  const nav = useNavigate();


  useEffect(() => {
    questionsService
      .tags()
      .then(setTags)
      .catch(() => void 0);
  }, []);


  const load = async () => {
    setLoading(true);
    try {

      const data = await questionsService.list({
        q: q || undefined,
        tag,
        sort,
      } as any);
      setRows(data);
    } catch {
      message.error("Không tải được danh sách câu hỏi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);



  }, [tag, sort]); 

  return (
    <div style={{ display: "flex", gap: "24px", fontFamily: "sans-serif" }}>
      {/* CỘT CHÍNH: HIỂN THỊ DANH SÁCH CÂU HỎI */}
      <div style={{ flex: 1 }}>
        {/* Hàng Tiêu Đề + Nút Ask */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <Typography.Title level={3} style={{ margin: 0, fontWeight: 400 }}>
            UniBrain Questions
          </Typography.Title>
          <Space>
            <Button
              type="primary"
              style={{
                backgroundColor: "#0a95ff",
                borderColor: "transparent",
                borderRadius: "3px",
              }}
              onClick={() => nav("/ask")}
            >
              Ask Question
            </Button>
          </Space>
        </div>

        {/* Thanh tìm kiếm và bộ lọc của bạn (Được gom gọn lại) */}
        <Card
          style={{
            marginBottom: "20px",
            padding: "0px",
            borderRadius: "3px",
            backgroundColor: "#fdf7e2",
            borderColor: "#f1e5bc",
          }}
          bodyStyle={{ padding: "12px" }}
        >
          <Space wrap size="middle">
            <Input.Search
              placeholder="Filter by keyword..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm React, MySQL, thuật toán..."
              style={{
                height: 48,
                borderRadius: 16,
                border: "none",
                boxShadow: "0 10px 28px rgba(0,0,0,0.12)",
              }}
            />
            <Select
              allowClear
              placeholder="Filter by tag"
              value={tag}
              onChange={(v) => setTag(v)}
              options={tags.map((t) => ({ label: t.name, value: t.name }))}
              style={{ width: 200 }}
            />
            <Select
              value={sort}
              onChange={(v) => setSort(v)}
              options={[
                { label: "Mới nhất", value: "recent" },
                { label: "Nhiều vote nhất", value: "most-votes" },
                { label: "Nhiều lượt xem nhất", value: "most-views" },
                { label: "Nhiều bình luận nhất", value: "most-comments" },
              ]}
              style={{ width: 200 }}
            />
            <span
              style={{
                fontSize: "0.9rem",
                color: "#6a737c",
                marginLeft: "8px",
              }}
            >
              {rows.length} questions found
            </span>

          </Space>
        </section>
        {/* VÙNG CHỨA DANH SÁCH ITEMS (THAY THẾ CHO TABLE) */}
        <Spin spinning={loading}>
          <div style={{ borderTop: "1px solid #e3e6e8" }}>
            {rows.length === 0 && !loading ? (
              <div
                style={{
                  padding: "40px text-align: center",
                  color: "#6a737c",
                  textAlign: "center",
                }}
              >
                No questions match your criteria.
              </div>
            ) : (
              rows.map((r) => {
                // Giả định antd Table lấy votes từ r.votes hoặc r.score như code cũ của bạn
                const score = r.votes?.score ?? (r as any).score ?? 0;
                const answers = r.answersCount ?? 0;
                const views = (r as any).viewCount ?? 0;

                return (
                  <div
                    key={r.id}
                    style={{
                      display: "flex",
                      padding: "16px 8px",
                      borderBottom: "1px solid #e3e6e8",
                      fontSize: "0.85rem",
                    }}
                  >
                    {/* Thống kê chỉ số bên trái (Cực kỳ giống StackOverflow) */}
                    <div
                      style={{
                        width: "100px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: "6px",
                        marginRight: "16px",
                        color: "#6a737c",
                        flexShrink: 0,
                        paddingTop: "2px",
                      }}
                    >
                      <div style={{ color: "#232629", fontWeight: 500 }}>
                        {score} votes
                      </div>
                      <div style={{ color: "#6a737c" }}>{views} views</div>

                      {/* Nếu có câu trả lời thì đóng khung viền xanh lá */}
                      <div
                        style={{
                          border: answers > 0 ? "1px solid #2f6f44" : "none",
                          color: answers > 0 ? "#2f6f44" : "#6a737c",
                          borderRadius: "3px",
                          padding: answers > 0 ? "2px 6px" : "0",
                        }}
                      >
                        {answers} answers
                      </div>
                    </div>

                    {/* Nội dung câu hỏi bên phải */}
                    <div style={{ flex: 1 }}>
                      {/* Tiêu đề link xanh */}
                      <h3
                        style={{
                          margin: "0 0 6px 0",
                          fontWeight: 400,
                          fontSize: "1.05rem",
                        }}
                      >
                        <Link
                          to={`/questions/${r.id}`}
                          style={{ color: "#0074cc", textDecoration: "none" }}
                          className="so-question-link"
                        >
                          {r.title}
                        </Link>
                      </h3>

                      {/* Phân hàng Footer cho Item: Chứa Tag & Tác giả */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "8px",
                          marginTop: "12px",
                        }}
                      >
                        {/* Tags */}
                        <div style={{ display: "flex", gap: "4px" }}>
                          {r.tags.map((t) => (
                            <AntTag
                              key={t.id}
                              style={{
                                backgroundColor: "#e1ecf4",
                                color: "#39739d",
                                borderColor: "transparent",
                                fontSize: "0.75rem",
                                padding: "2px 6px",
                                borderRadius: "3px",
                              }}
                            >
                              {t.name}
                            </AntTag>
                          ))}
                        </div>

                        {/* Thông tin tác giả, ngày đăng */}
                        <div style={{ fontSize: "0.75rem", color: "#6a737c" }}>
                          <span style={{ color: "#0074cc", cursor: "pointer" }}>
                            {(r.author as any)?.fullName ?? "Anonymous"}
                          </span>{" "}
                          <span style={{ color: "#9199a1" }}>
                            asked{" "}
                            {r.createdAt
                              ? new Date(r.createdAt).toLocaleDateString()
                              : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Spin>
      </div>

      {/* CỘT PHẢI: SIDEBAR PHỤ (WIDGET BOX) */}
      <div style={{ width: "280px", flexShrink: 0 }} className="hidden-md">
        <div
          style={{
            backgroundColor: "#fdf7e2",
            border: "1px solid #f1e5bc",
            borderRadius: "3px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            fontSize: "0.75rem",
            padding: "12px",
          }}
        >
          <h4
            style={{
              borderBottom: "1px solid #f1e5bc",
              paddingBottom: "8px",
              marginBottom: "8px",
              color: "#525960",
              marginTop: 0,
            }}
          >
            The UniBrain Blog
          </h4>
          <ul
            style={{
              paddingLeft: "16px",
              margin: 0,
              color: "#3b4045",
              lineHeight: "1.5",
            }}
          >
            <li style={{ marginBottom: "8px", cursor: "pointer" }}>
              Standardizing developer platforms across legacy codebases
            </li>
            <li style={{ cursor: "pointer" }}>
              Why standard tables are moving back to inline row feeds
            </li>
          </ul>

        </div>
      </div>
    </div>
  );
}
