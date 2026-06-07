import { App, Button, Form, Input, Typography, Space, Card, Tag } from "antd";
import { ArrowLeftOutlined, SendOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { history } from "umi";
import { TinyEditor } from "../components/common/TinyEditor";
import { questionsService } from "../services/questions";
import type { Tag as TagType } from "../models/qa";

const { Title, Text } = Typography;
const { CheckableTag } = Tag;

export default function AskQuestionPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<TagType[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    questionsService
      .tags()
      .then(setTags)
      .catch(() => {
        message.error(
          "Không thể tải danh sách thẻ (tags). Vui lòng thử lại sau.",
        );
      });
  }, [message]);

  const toggleTag = (tagName: string, checked: boolean) => {
    const nextSelectedTags = checked
      ? [...selectedTags, tagName]
      : selectedTags.filter((t) => t !== tagName);

    setSelectedTags(nextSelectedTags);
    form.setFieldsValue({ tags: nextSelectedTags }); // Cập nhật lại giá trị cho Form validate
  };

  const handleFinish = async (values: any) => {
    const payload = { ...values, tags: selectedTags };
    setLoading(true);
    try {
      const created = await questionsService.create(payload);
      message.success("Đăng câu hỏi thành công!");
      history.push(`/questions/${created.id}`);
    } catch (error) {
      console.error(error);
      message.error("Đã có lỗi xảy ra khi gửi câu hỏi. Vui lòng kiểm tra lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#fafafa",
        minHeight: "100vh",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => history.back()}
          style={{ marginBottom: 24, color: "#64748b" }}
        >
          Quay lại danh sách
        </Button>

        <Card
          bordered={false}
          style={{ borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
          styles={{ body: { padding: "40px" } }}
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{ tags: [] as string[], content: "" }}
            onFinish={handleFinish}
            requiredMark={false}
          >
            {/* Tiêu đề câu hỏi - Phong cách Typo lớn, không viền */}
            <Form.Item
              name="title"
              rules={[
                { required: true, message: "Vui lòng nhập tiêu đề câu hỏi" },
                { min: 10, message: "Tiêu đề cần tối thiểu 10 ký tự" },
              ]}
              style={{ marginBottom: 32 }}
            >
              <Input
                variant="borderless"
                placeholder="Tiêu đề câu hỏi của bạn..."
                maxLength={150}
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  padding: 0,
                  color: "#0f172a",
                  letterSpacing: "-0.02em",
                }}
              />
            </Form.Item>

            {/* Nội dung Editor */}
            <Form.Item
              name="content"
              rules={[
                { required: true, message: "Vui lòng nhập nội dung chi tiết" },
                { min: 20, message: "Nội dung cần tối thiểu 20 ký tự" },
              ]}
              style={{ marginBottom: 32 }}
            >
              <div style={{ minHeight: 400 }}>
                <TinyEditor />
              </div>
            </Form.Item>

            {/* Vùng chọn Tags sử dụng CheckableTag chuyên nghiệp */}
            <div
              style={{
                marginBottom: 40,
                padding: "24px",
                backgroundColor: "#f8fafc",
                borderRadius: 12,
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: 16 }}>
                  Phân loại chủ đề
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Chọn các thẻ phù hợp để câu hỏi của bạn tiếp cận đúng chuyên
                  gia.
                </Text>
              </div>

              <Space size={[0, 8]} wrap>
                {tags.map((tag) => (
                  <CheckableTag
                    key={tag.id || tag.name}
                    checked={selectedTags.includes(tag.name)}
                    onChange={(checked) => toggleTag(tag.name, checked)}
                    style={{
                      fontSize: 14,
                      padding: "4px 16px",
                      border: "1px solid #e2e8f0",
                      borderRadius: 20,
                    }}
                  >
                    {tag.name}
                  </CheckableTag>
                ))}
              </Space>

              {/* Trường ẩn để Form validate mảng tags */}
              <Form.Item
                name="tags"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn ít nhất 1 thẻ phân loại",
                  },
                ]}
                style={{ marginBottom: 0, height: 0, overflow: "hidden" }}
              >
                <Input />
              </Form.Item>
            </div>

            {/* Nút Submit */}
            <div style={{ textAlign: "right" }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                icon={<SendOutlined />}
                style={{
                  borderRadius: 8,
                  padding: "0 32px",
                  height: 48,
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                Xuất bản câu hỏi
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
}
