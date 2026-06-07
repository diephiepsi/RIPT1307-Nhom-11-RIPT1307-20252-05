import {
  App,
  Avatar,
  Button,
  Drawer,
  Dropdown,
  Form,
  Input,
  Select,
  Space,
  Switch,
  Typography,
  Tooltip,
} from "antd";
import type { MenuProps } from "antd";
import {
  MoreOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useRef, useState } from "react";
import { ProTable } from "@ant-design/pro-components";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import { adminService } from "../../services/admin";

// --- TYPE DEFINITIONS ---
type AdminUserRow = {
  id: string;
  email: string;
  fullName: string;
  role: "STUDENT" | "LECTURER" | "ADMIN";
  locked: boolean;
  createdAt: string;
};

const { Title, Text } = Typography;

// --- ENUMS CHO TÍNH NĂNG SEARCH & RENDER TỰ ĐỘNG ---
const ROLE_ENUM = {
  STUDENT: { text: "Sinh viên", status: "Default" },
  LECTURER: { text: "Giảng viên", status: "Success" },
  ADMIN: { text: "Quản trị viên", status: "Processing" },
};

const STATUS_ENUM = {
  false: { text: "Hoạt động", status: "Success" },
  true: { text: "Đã khóa", status: "Error" },
};

export default function AdminUsersPage() {
  const { message, modal } = App.useApp();
  const actionRef = useRef<ActionType>();
  const [form] = Form.useForm();

  // Quản lý trạng thái
  const [drawerConfig, setDrawerConfig] = useState<{
    open: boolean;
    type: "create" | "update";
    record?: AdminUserRow;
  }>({ open: false, type: "create" });

  const [submitting, setSubmitting] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // --- HANDLERS ---
  const handleOpenDrawer = (
    type: "create" | "update",
    record?: AdminUserRow,
  ) => {
    form.resetFields();
    if (type === "update" && record) {
      form.setFieldsValue(record);
    }
    setDrawerConfig({ open: true, type, record });
  };

  const handleCloseDrawer = () => {
    setDrawerConfig({ open: false, type: "create" });
  };

  const handleFormSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      if (drawerConfig.type === "create") {
        await adminService.createUser(values);
        message.success("Đã tạo người dùng mới thành công");
      } else if (drawerConfig.record) {
        await adminService.updateUser(drawerConfig.record.id, values);
        message.success("Cập nhật thông tin thành công");
      }
      handleCloseDrawer();
      actionRef.current?.reload();
    } catch {
      message.error(
        `${drawerConfig.type === "create" ? "Thêm" : "Cập nhật"} thất bại. Vui lòng thử lại.`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchDelete = () => {
    if (!selectedRowKeys.length) return;
    modal.confirm({
      title: `Xóa ${selectedRowKeys.length} tài khoản?`,
      content: "Các tài khoản đã chọn sẽ bị xóa vĩnh viễn khỏi hệ thống.",
      okText: "Xóa tất cả",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        try {
          // Xử lý xóa hàng loạt (Giả định service hỗ trợ xóa từng id)
          await Promise.all(
            selectedRowKeys.map((id) => adminService.deleteUser(id as string)),
          );
          message.success(`Đã xóa ${selectedRowKeys.length} tài khoản.`);
          setSelectedRowKeys([]);
          actionRef.current?.reload();
        } catch {
          message.error("Xóa hàng loạt thất bại. Vui lòng kiểm tra lại.");
        }
      },
    });
  };

  // --- BỐ CỤC CỘT DỮ LIỆU ---
  const columns: ProColumns<AdminUserRow>[] = [
    {
      title: "Người dùng",
      dataIndex: "fullName",
      width: "25%",
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
      render: (_, row) => (
        <Space>
          <Tooltip title={row.role}>
            <Avatar
              icon={<UserOutlined />}
              style={{ backgroundColor: row.locked ? "#d9d9d9" : "#1677ff" }}
            >
              {row.fullName.charAt(0).toUpperCase()}
            </Avatar>
          </Tooltip>
          <Text strong style={{ color: row.locked ? "#8c8c8c" : "inherit" }}>
            {row.fullName}
          </Text>
        </Space>
      ),
    },
    {
      title: "Email liên hệ",
      dataIndex: "email",
      copyable: true,
      width: "20%",
      render: (_, row) => <Text type="secondary">{row.email}</Text>,
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      width: "15%",
      valueType: "select",
      valueEnum: ROLE_ENUM,
    },
    {
      title: "Trạng thái",
      dataIndex: "locked",
      width: "15%",
      valueType: "select",
      valueEnum: STATUS_ENUM,
      render: (_, row) => (
        <Switch
          size="small"
          checked={!row.locked}
          checkedChildren="Hoạt động"
          unCheckedChildren="Đã khóa"
          onChange={async (checked) => {
            try {
              await adminService.updateUser(row.id, { locked: !checked });
              message.success(`Đã ${!checked ? "khóa" : "mở khóa"} tài khoản`);
              actionRef.current?.reload();
            } catch {
              message.error("Cập nhật trạng thái thất bại");
            }
          }}
        />
      ),
    },
    {
      title: "Ngày tham gia",
      dataIndex: "createdAt",
      valueType: "date",
      width: "15%",
      search: false,
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Hành động",
      key: "actions",
      align: "center",
      width: "10%",
      search: false,
      render: (_, row) => {
        const menuItems: MenuProps["items"] = [
          {
            key: "edit",
            icon: <EditOutlined />,
            label: "Chỉnh sửa",
            onClick: () => handleOpenDrawer("update", row),
          },
          {
            key: "reset",
            icon: <KeyOutlined />,
            label: "Reset mật khẩu",
            onClick: async () => {
              try {
                await adminService.resetPassword(row.id);
                message.success("Đã gửi liên kết đặt lại mật khẩu");
              } catch {
                message.error("Không thể đặt lại mật khẩu");
              }
            },
          },
          {
            type: "divider",
          },
          {
            key: "delete",
            icon: <DeleteOutlined />,
            label: "Xóa tài khoản",
            danger: true,
            onClick: () => {
              modal.confirm({
                title: "Xóa người dùng này?",
                content: "Dữ liệu không thể khôi phục sau khi xóa.",
                okText: "Xóa vĩnh viễn",
                okButtonProps: { danger: true },
                cancelText: "Hủy bỏ",
                onOk: async () => {
                  try {
                    await adminService.deleteUser(row.id);
                    message.success("Đã xóa thành công");
                    actionRef.current?.reload();
                  } catch {
                    message.error("Xóa thất bại");
                  }
                },
              });
            },
          },
        ];

        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={["click"]}
            placement="bottomRight"
            arrow
          >
            <Button
              type="text"
              icon={<MoreOutlined style={{ fontSize: 18 }} />}
            />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f0f2f5",
        minHeight: "100vh",
      }}
    >
      <ProTable<AdminUserRow>
        headerTitle={
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Quản trị Người dùng
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Kiểm soát và phân quyền thành viên hệ thống
            </Text>
          </div>
        }
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        cardBordered
        request={async () => {
          try {
            const { data } = await adminService.getUsers();
            return { data, success: true };
          } catch (err) {
            message.error("Lỗi khi tải dữ liệu từ máy chủ");
            return { data: [], success: false };
          }
        }}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        tableAlertOptionRender={() => {
          return (
            <Space size={16}>
              <Button type="link" danger onClick={handleBatchDelete}>
                Xóa hàng loạt
              </Button>
              <Button type="link" onClick={() => setSelectedRowKeys([])}>
                Bỏ chọn
              </Button>
            </Space>
          );
        }}
        search={{
          labelWidth: "auto",
          collapsed: false,
        }}
        toolBarRender={() => [
          <Button
            key="button"
            icon={<PlusOutlined />}
            type="primary"
            onClick={() => handleOpenDrawer("create")}
          >
            Thêm thành viên
          </Button>,
        ]}
        options={{
          setting: { listsHeight: 400 },
          density: true,
          fullScreen: true,
        }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
        }}
      />

      <Drawer
        title={
          <Text strong style={{ fontSize: 16 }}>
            {drawerConfig.type === "create"
              ? "Thêm thành viên mới"
              : "Chỉnh sửa thông tin"}
          </Text>
        }
        width={450}
        onClose={handleCloseDrawer}
        open={drawerConfig.open}
        bodyStyle={{ paddingBottom: 80 }}
        footer={
          <div style={{ textAlign: "right" }}>
            <Space>
              <Button onClick={handleCloseDrawer}>Hủy</Button>
              <Button
                onClick={() => form.submit()}
                type="primary"
                loading={submitting}
              >
                {drawerConfig.type === "create" ? "Tạo mới" : "Lưu thay đổi"}
              </Button>
            </Space>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          requiredMark="optional"
        >
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
          >
            <Input
              size="large"
              placeholder="Nhập họ và tên"
              prefix={<UserOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email đăng nhập"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Định dạng email không hợp lệ" },
            ]}
          >
            <Input
              size="large"
              placeholder="name@domain.com"
              disabled={drawerConfig.type === "update"}
            />
          </Form.Item>

          {drawerConfig.type === "create" && (
            <Form.Item
              name="password"
              label="Mật khẩu khởi tạo"
              rules={[{ required: true, min: 6, message: "Tối thiểu 6 ký tự" }]}
            >
              <Input.Password
                size="large"
                placeholder="Nhập mật khẩu an toàn"
                prefix={<KeyOutlined />}
              />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="Vai trò (Quyền hạn)"
            rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
          >
            <Select
              size="large"
              placeholder="Chọn vai trò"
              options={[
                { label: "Sinh viên", value: "STUDENT" },
                { label: "Giảng viên", value: "LECTURER" },
                { label: "Quản trị viên", value: "ADMIN" },
              ]}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
