import { useState } from "react";
import {
  Collapse,
  Tag,
  Table,
  Spin,
  Empty,
  Typography,
  Space,
  Button,
  Input,
  Modal,
  Form,
  Switch,
  notification,
} from "antd";
import { EditOutlined } from "@ant-design/icons";
import {
  useCategoriesList,
  useCategoriesCreate,
  useCategoriesPartialUpdate,
} from "../api/generated/categories/categories";
import { useCategoriesCodesCreate } from "../api/generated/categories/categories";
import { useCodesPartialUpdate } from "../api/generated/codes/codes";
import ExpenseItem from "./ExpenseItem";

const { Title, Text } = Typography;

const ExpenseList = () => {
  const [api, contextHolder] = notification.useNotification();

  const notify = (message: string, description?: string) => {
    api.error({ message, description, placement: "topRight" });
  };

  const { data, isLoading, isError, refetch } = useCategoriesList();
  const { mutateAsync: createCategory } = useCategoriesCreate({
    mutation: {
      onSuccess: () => refetch(),
      onError: () => notify("Failed to create category"),
    },
  });
  const { mutateAsync: updateCategory } = useCategoriesPartialUpdate({
    mutation: {
      onSuccess: () => refetch(),
      onError: () => notify("Failed to update category"),
    },
  });
  const { mutateAsync: createCode } = useCategoriesCodesCreate({
    mutation: {
      onSuccess: () => refetch(),
      onError: () => notify("Failed to create code"),
    },
  });
  const { mutateAsync: updateCode } = useCodesPartialUpdate({
    mutation: {
      onSuccess: () => refetch(),
      onError: () => notify("Failed to update code"),
    },
  });

  const [showNewCategoryInput, toggleNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [editModal, setEditModal] = useState<{
    open: boolean;
    id: string;
    name: string;
    is_active: boolean;
  }>({ open: false, id: "", name: "", is_active: true });

  const [codeModal, setCodeModal] = useState<{
    open: boolean;
    categoryId: string;
  }>({ open: false, categoryId: "" });

  const [editCodeModal, setEditCodeModal] = useState<{
    open: boolean;
    id: string;
    code: string;
    is_active: boolean;
  }>({ open: false, id: "", code: "", is_active: true });

  const [codeForm] = Form.useForm();

  const handleSubmitCategory = async () => {
    try {
      const createCat = await createCategory({
        data: { name: newCategoryName },
      });
      if (createCat.status === 201) {
        setNewCategoryName("");
        toggleNewCategoryInput(false);
      } else {
        notify("Failed to create category");
      }
    } catch (err) {
      notify(`Failed to create category: ${err?.toString()}`);
    }
  };

  const handleEditSave = async () => {
    await updateCategory({
      id: editModal.id,
      data: { name: editModal.name, is_active: editModal.is_active },
    });
    setEditModal({ open: false, id: "", name: "", is_active: true });
  };

  const handleAddCode = async () => {
    const values = await codeForm.validateFields();
    await createCode({ id: codeModal.categoryId, data: { ...values } });
    codeForm.resetFields();
    setCodeModal({ open: false, categoryId: "" });
  };

  const handleEditCodeSave = async () => {
    await updateCode({
      id: editCodeModal.id,
      data: { code: editCodeModal.code, is_active: editCodeModal.is_active },
    });
    setEditCodeModal({ open: false, id: "", code: "", is_active: true });
  };

  const codeColumns = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      render: (val: string) => <Text code>{val}</Text>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (val: string) => val || <Text type="secondary">—</Text>,
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      render: (val: boolean) =>
        val ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>,
    },
    {
      title: "",
      key: "actions",
      render: (_: any, record: any) => (
        <Button
          type="text"
          size="small"
          icon={<EditOutlined />}
          onClick={() =>
            setEditCodeModal({
              open: true,
              id: record.id,
              code: record.code,
              is_active: record.is_active,
            })
          }
        />
      ),
    },
  ];

  if (isLoading)
    return (
      <Space
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" style={{ display: "block", margin: "80px auto" }} />
      </Space>
    );
  if (isError) return <Empty description="Failed to load categories" />;

  const categories = data?.data ?? [];

  const items = categories.map((cat) => ({
    key: cat.id,
    label: (
      <ExpenseItem
        category={cat}
        setEditModal={() =>
          setEditModal({
            open: true,
            id: cat.id,
            name: cat.name,
            is_active: cat?.is_active ?? false,
          })
        }
        setCodeModal={() => setCodeModal({ open: true, categoryId: cat.id })}
      />
    ),
    children:
      cat.codes.length > 0 ? (
        <Table
          dataSource={cat.codes}
          columns={codeColumns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      ) : (
        <Empty
          description="No codes yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ),
  }));

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 24px" }}>
      {contextHolder}
      <Space style={{ display: "flex", justifyContent: "space-between" }}>
        <Title level={3} style={{ marginBottom: 24 }}>
          Expense Categories
        </Title>
        <Button onClick={() => toggleNewCategoryInput(!showNewCategoryInput)}>
          Add Category
        </Button>
      </Space>

      {showNewCategoryInput && (
        <Space.Compact style={{ width: "100%", marginBottom: 12 }}>
          <Input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Category name"
            onPressEnter={handleSubmitCategory}
          />
          <Button onClick={handleSubmitCategory}>Submit</Button>
        </Space.Compact>
      )}

      {!!items.length && (
        <Collapse style={{ marginTop: 12 }} items={items} accordion />
      )}
      {!items.length && (
        <Empty
          description="No categories yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button onClick={() => toggleNewCategoryInput(true)}>
            Create your first category
          </Button>
        </Empty>
      )}

      {/* Edit category modal */}
      <Modal
        title="Edit category"
        open={editModal.open}
        onOk={handleEditSave}
        onCancel={() =>
          setEditModal({ open: false, id: "", name: "", is_active: true })
        }
        okText="Save"
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input
            value={editModal.name}
            onChange={(e) =>
              setEditModal((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Category name"
          />
          <Space>
            <Switch
              checked={editModal.is_active}
              onChange={(val) =>
                setEditModal((prev) => ({ ...prev, is_active: val }))
              }
            />
            <Text>{editModal.is_active ? "Active" : "Inactive"}</Text>
          </Space>
        </Space>
      </Modal>

      {/* Add code modal */}
      <Modal
        title="Add expense code"
        open={codeModal.open}
        onOk={handleAddCode}
        onCancel={() => {
          codeForm.resetFields();
          setCodeModal({ open: false, categoryId: "" });
        }}
        okText="Add"
      >
        <Form form={codeForm} layout="vertical">
          <Form.Item
            name="code"
            label="Code"
            rules={[{ required: true, message: "Code is required" }]}
          >
            <Input placeholder="e.g. T001" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input placeholder="Optional description" />
          </Form.Item>
          <Form.Item
            name="is_active"
            label="Active"
            initialValue={true}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit code modal */}
      <Modal
        title="Edit code"
        open={editCodeModal.open}
        onOk={handleEditCodeSave}
        onCancel={() =>
          setEditCodeModal({ open: false, id: "", code: "", is_active: true })
        }
        okText="Save"
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input
            value={editCodeModal.code}
            onChange={(e) =>
              setEditCodeModal((prev) => ({ ...prev, code: e.target.value }))
            }
            placeholder="Code"
          />
          <Space>
            <Switch
              checked={editCodeModal.is_active}
              onChange={(val) =>
                setEditCodeModal((prev) => ({ ...prev, is_active: val }))
              }
            />
            <Text>{editCodeModal.is_active ? "Active" : "Inactive"}</Text>
          </Space>
        </Space>
      </Modal>
    </div>
  );
};

export default ExpenseList;
