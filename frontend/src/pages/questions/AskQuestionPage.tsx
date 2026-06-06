import { App, Button, Form, Input, Select, Typography } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TinyEditor } from "../../components/common/TinyEditor";
import type { Tag } from "../../models/qa";
import { questionsService } from "../../services/questions";
import "../../styles/theme.css";

export function AskQuestionPage() {
  const { message } = App.useApp();
  const nav = useNavigate();
  const [tags, setTags] = useState<Tag[]>([]);
  // State để quản lý trạng thái loading khi đang gửi bài
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    questionsService
      .tags()
      .then(setTags)
      .catch(() => void 0);
  }, []);

  return (
    <div
      className="ub-container"
      style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}
    >
      <div className="ub-title">
        <Typography.Title level={2} style={{ margin: 0, fontSize: "1.6rem" }}>
          Đặt câu hỏi
        </Typography.Title>
      </div>

      <Form
        className="ub-form"
        layout="vertical"
        initialValues={{ tags: [] as string[], content: "" }}
        requiredMark={false}
        onFinish={async (values) => {
          if (submitting) return; // Chặn nếu đã bấm rồi và đang tải
          setSubmitting(true);
          try {
            const created = await questionsService.create(values);
            message.success("Đã gửi yêu cầu đăng thành công, đang chờ duyệt!");
            nav(`/questions/${created.id}`);
          } catch (err: any) {
            message.error(
              err?.response?.data?.message || "Có lỗi xảy ra khi đăng bài",
            );
          } finally {
            setSubmitting(false); // Tắt loading sau khi gọi API xong
          }
        }}
      >
        <div className="ub-card">
          <Form.Item
            name="title"
            label={
              <div>
                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "#0c0d0e",
                  }}
                >
                  Tiêu đề
                </div>
                <div className="ub-muted">
                  Hãy mô tả cụ thể vấn đề; tiêu đề càng rõ ràng càng dễ nhận
                  được trả lời.
                </div>
              </div>
            }
            rules={[
              {
                required: true,
                message: "Vui lòng nhập tiêu đề (ít nhất 10 ký tự)",
                min: 10,
              },
            ]}
          >
            <Input
              className="ub-input"
              placeholder="Ví dụ: Làm sao để tìm chỉ số phần tử trong R?"
            />
          </Form.Item>
        </div>

        <div className="ub-card">
          <Form.Item
            name="content"
            label={
              <div>
                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "#0c0d0e",
                  }}
                >
                  Nội dung
                </div>
                <div className="ub-muted">
                  Mô tả chi tiết vấn đề và các bước bạn đã thử. Tối thiểu 20 ký
                  tự.
                </div>
              </div>
            }
            rules={[
              { required: true, message: "Vui lòng nhập nội dung" },
              {
                validator: (_, v: string) =>
                  !v || v.replace(/<[^>]+>/g, "").trim().length >= 20
                    ? Promise.resolve()
                    : Promise.reject(new Error("Nội dung tối thiểu 20 ký tự")),
              },
            ]}
          >
            <TinyEditor />
          </Form.Item>
        </div>

        <div className="ub-card">
          <Form.Item
            name="tags"
            label={
              <div>
                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "#0c0d0e",
                  }}
                >
                  Thẻ
                </div>
                <div className="ub-muted">
                  Thêm tối đa 5 thẻ để mô tả chủ đề câu hỏi.
                </div>
              </div>
            }
            rules={[
              { required: true, message: "Vui lòng chọn ít nhất một thẻ" },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Ví dụ: javascript, reactjs, c++"
              options={tags.map((t) => ({ label: t.name, value: t.name }))}
              style={{ width: "100%" }}
              // keep dropdown styling default; chosen tags use custom renderer
              tagRender={({ label, onClose }) => (
                <span className="ub-tag">
                  {label}
                  <span
                    onClick={onClose}
                    style={{ marginLeft: 8, cursor: "pointer" }}
                  >
                    ×
                  </span>
                </span>
              )}
            />
          </Form.Item>
        </div>

        <div style={{ marginTop: 28, marginBottom: 40 }}>
          <Button
            type="primary"
            htmlType="submit"
            className="ub-btn ub-btn-primary"
            loading={submitting}
            disabled={submitting}
          >
            Gửi câu hỏi
          </Button>
        </div>
      </Form>
    </div>
  );
}
