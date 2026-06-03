import { App, Button, Form, Input, Modal, Space, Switch, Table, Typography, Select, Popconfirm } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../services/api'; // Sử dụng adminApi đã được cập nhật

type AdminUserRow = {
  id: string;
  email: string;
  fullName: string;
  role: 'STUDENT' | 'LECTURER' | 'ADMIN';
  locked: boolean;
  createdAt: string;
};

export function AdminUsersPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null);
  
  const [form] = Form.useForm(); // Sử dụng form instance để set data khi edit

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getUsers();
      setRows(data);
    } catch {
      message.error('Không tải được danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openEdit = (user: AdminUserRow) => {
    setEditingUser(user);
    form.setFieldsValue({ fullName: user.fullName, role: user.role });
    setOpenEditModal(true);
  };

  const columns = useMemo(
    () => [
      { title: 'Email', dataIndex: 'email' },
      { title: 'Họ tên', dataIndex: 'fullName' },
      { title: 'Vai trò', dataIndex: 'role' },
      { title: 'Ngày tạo', dataIndex: 'createdAt' },
      {
        title: 'Khóa tài khoản',
        render: (_: unknown, r: AdminUserRow) => (
          <Switch
            checked={r.locked}
            onChange={async (checked) => {
              try {
                // Gọi API cập nhật trạng thái khóa
                await adminApi.updateUser(r.id, { locked: checked });
                message.success(checked ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
                await load();
              } catch {
                message.error('Cập nhật trạng thái thất bại');
              }
            }}
          />
        ),
      },
      {
        title: 'Hành động',
        render: (_: unknown, r: AdminUserRow) => (
          <Space>
            {/* Nút Sửa */}
            <Button type="primary" size="small" onClick={() => openEdit(r)}>
              Sửa
            </Button>
            
            {/* Nút Xóa có Popconfirm cảnh báo */}
            <Popconfirm
              title="Bạn có chắc muốn xóa người dùng này?"
              onConfirm={async () => {
                try {
                  await adminApi.deleteUser(r.id);
                  message.success('Đã xóa người dùng thành công');
                  await load();
                } catch {
                  message.error('Lỗi khi xóa người dùng');
                }
              }}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button danger size="small">Xóa</Button>
            </Popconfirm>

            {/* Nút Reset Mật Khẩu */}
            <Button
              size="small"
              onClick={async () => {
                try {
                  await adminApi.resetPassword(r.id);
                  message.success('Đã reset mật khẩu thành công về 123456');
                } catch {
                  message.error('Reset mật khẩu thất bại');
                }
              }}
            >
              Reset Pass
            </Button>
          </Space>
        ),
      },
    ],
    [message]
  );

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Quản lý người dùng
        </Typography.Title>
        <Button type="primary" onClick={() => setOpenAddModal(true)}>
          Thêm người dùng
        </Button>
      </Space>

      <Table rowKey="id" loading={loading} columns={columns} dataSource={rows} />

      {/* Modal Thêm Người Dùng Mới */}
      <Modal title="Thêm người dùng" open={openAddModal} onCancel={() => setOpenAddModal(false)} footer={null} destroyOnClose>
        <Form
          layout="vertical"
          onFinish={async (values) => {
            try {
              await adminApi.createUser(values);
              message.success('Đã thêm người dùng mới');
              setOpenAddModal(false);
              await load();
            } catch {
              message.error('Thêm người dùng thất bại');
            }
          }}
        >
          <Form.Item name="fullName" label="Họ tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}>
             <Select placeholder="Chọn vai trò">
                <Select.Option value="STUDENT">Sinh viên</Select.Option>
                <Select.Option value="LECTURER">Giảng viên</Select.Option>
                <Select.Option value="ADMIN">Quản trị viên</Select.Option>
             </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Tạo user
          </Button>
        </Form>
      </Modal>

      {/* Modal Sửa Người Dùng (Chỉ sửa Tên và Quyền) */}
      <Modal 
        title={`Chỉnh sửa: ${editingUser?.email}`} 
        open={openEditModal} 
        onCancel={() => {
            setOpenEditModal(false);
            setEditingUser(null);
            form.resetFields();
        }} 
        footer={null} 
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            if (!editingUser) return;
            try {
              await adminApi.updateUser(editingUser.id, {
                fullName: values.fullName,
                role: values.role
              });
              message.success('Đã cập nhật thông tin');
              setOpenEditModal(false);
              await load();
            } catch {
              message.error('Cập nhật thất bại');
            }
          }}
        >
          <Form.Item name="fullName" label="Họ tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}>
             <Select placeholder="Chọn vai trò">
                <Select.Option value="STUDENT">Sinh viên</Select.Option>
                <Select.Option value="LECTURER">Giảng viên</Select.Option>
                <Select.Option value="ADMIN">Quản trị viên</Select.Option>
             </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Lưu thay đổi
          </Button>
        </Form>
      </Modal>
    </Space>
  );
}