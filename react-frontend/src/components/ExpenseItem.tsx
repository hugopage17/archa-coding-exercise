import { Tag, Typography, Button, Dropdown } from "antd";
import { MoreOutlined, PlusOutlined } from "@ant-design/icons";
import {
  useCategoriesList,
  useCategoriesPartialUpdate,
} from "../api/generated/categories/categories";
import type { ExpenseCategory } from "../api/generated/.ts.schemas";

const { Text } = Typography;

interface IProps {
  category: ExpenseCategory;
  setCodeModal: (params: { open: boolean; categoryId: string }) => void;
  setEditModal: (params: {
    open: boolean;
    id: string;
    name: string;
    is_active: boolean;
  }) => void;
}

const ExpenseItem = ({ category, setCodeModal, setEditModal }: IProps) => {
  const { refetch } = useCategoriesList();
  const { mutateAsync: updateCategory } = useCategoriesPartialUpdate({
    mutation: { onSuccess: () => refetch() },
  });

  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 12 }}
      onClick={(e) => e.stopPropagation()}
    >
      <Text strong onClick={(e) => e.stopPropagation()}>
        {category.name}
      </Text>
      <Tag color={category.is_active ? "blue" : "default"}>
        {category.is_active ? "Active" : "Inactive"}
      </Tag>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {category.codes.length} code{category.codes.length !== 1 ? "s" : ""}
      </Text>
      <Dropdown
        trigger={["click"]}
        menu={{
          items: [
            {
              key: "edit",
              label: "Edit name",
              onClick: () =>
                setEditModal({
                  open: true,
                  id: category.id,
                  name: category.name,
                  is_active: category.is_active ?? false,
                }),
            },
            {
              key: "toggle",
              label: category.is_active ? "Deactivate" : "Activate",
              onClick: () =>
                updateCategory({
                  id: category.id,
                  data: { is_active: !category.is_active },
                }),
            },
            {
              key: "add-code",
              label: "Add code",
              icon: <PlusOutlined />,
              onClick: () =>
                setCodeModal({ open: true, categoryId: category.id }),
            },
          ],
        }}
      >
        <Button
          type="text"
          size="small"
          icon={<MoreOutlined />}
          style={{ marginLeft: "auto" }}
          onClick={(e) => e.stopPropagation()}
        />
      </Dropdown>
    </div>
  );
};

export default ExpenseItem;
