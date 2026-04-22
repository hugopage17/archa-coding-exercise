import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import ExpenseList from "./ExpensesList";

// --- mocks ---
const mockRefetch = vi.fn();
const mockCreateCategory = vi.fn();
const mockUpdateCategory = vi.fn();
const mockCreateCode = vi.fn();

vi.mock("../api/generated/categories/categories", () => ({
  useCategoriesList: vi.fn(),
  useCategoriesCreate: vi.fn(() => ({ mutateAsync: mockCreateCategory })),
  useCategoriesPartialUpdate: vi.fn(() => ({
    mutateAsync: mockUpdateCategory,
  })),
  useCategoriesCodesCreate: vi.fn(() => ({ mutateAsync: mockCreateCode })),
}));

vi.mock("./ExpenseItem", () => ({
  default: ({ category, setEditModal, setCodeModal }: any) => (
    <div>
      <span>{category.name}</span>
      <button onClick={setEditModal}>edit-{category.name}</button>
      <button onClick={setCodeModal}>add-code-{category.name}</button>
    </div>
  ),
}));

import { useCategoriesList } from "../api/generated/categories/categories";

// --- helpers ---
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

const mockCategories = (overrides = {}) => {
  vi.mocked(useCategoriesList).mockReturnValue({
    data: {
      data: [
        { id: "cat-1", name: "Travel", is_active: true, codes: [] },
        {
          id: "cat-2",
          name: "Meals",
          is_active: false,
          codes: [
            {
              id: "code-1",
              code: "M001",
              description: "Lunch",
              is_active: true,
            },
          ],
        },
      ],
    },
    isLoading: false,
    isError: false,
    refetch: mockRefetch,
    ...overrides,
  } as any);
};

// --- tests ---
describe("ExpenseList", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows spinner while loading", () => {
    vi.mocked(useCategoriesList).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: mockRefetch,
    } as any);

    render(<ExpenseList />, { wrapper });
    expect(document.querySelector(".ant-spin")).toBeInTheDocument();
  });

  it("shows error state when fetch fails", () => {
    vi.mocked(useCategoriesList).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    } as any);

    render(<ExpenseList />, { wrapper });
    expect(screen.getByText("Failed to load categories")).toBeInTheDocument();
  });

  it("shows empty state when no categories", () => {
    vi.mocked(useCategoriesList).mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as any);

    render(<ExpenseList />, { wrapper });
    expect(screen.getByText("No categories yet")).toBeInTheDocument();
  });

  it("renders category names", async () => {
    mockCategories();
    render(<ExpenseList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Travel")).toBeInTheDocument();
      expect(screen.getByText("Meals")).toBeInTheDocument();
    });
  });

  it("shows add category input when button is clicked", async () => {
    mockCategories();
    render(<ExpenseList />, { wrapper });

    await userEvent.click(screen.getByText("Add Category"));
    expect(screen.getByPlaceholderText("Category name")).toBeInTheDocument();
  });

  it("calls createCategory with input value on submit", async () => {
    mockCategories();
    mockCreateCategory.mockResolvedValue({ status: 201 });

    render(<ExpenseList />, { wrapper });

    await userEvent.click(screen.getByText("Add Category"));
    await userEvent.type(
      screen.getByPlaceholderText("Category name"),
      "Transport",
    );
    await userEvent.click(screen.getByText("Submit"));

    expect(mockCreateCategory).toHaveBeenCalledWith({
      data: { name: "Transport" },
    });
  });

  it("hides input after successful category creation", async () => {
    mockCategories();
    mockCreateCategory.mockResolvedValue({ status: 201 });

    render(<ExpenseList />, { wrapper });

    await userEvent.click(screen.getByText("Add Category"));
    await userEvent.type(
      screen.getByPlaceholderText("Category name"),
      "Transport",
    );
    await userEvent.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Category name"),
      ).not.toBeInTheDocument();
    });
  });

  it("opens edit modal when edit is triggered", async () => {
    mockCategories();
    render(<ExpenseList />, { wrapper });

    await userEvent.click(screen.getByText("edit-Travel"));

    await waitFor(() => {
      expect(screen.getByText("Edit category")).toBeInTheDocument();
    });
  });

  it("opens add code modal when add code is triggered", async () => {
    mockCategories();
    render(<ExpenseList />, { wrapper });

    await userEvent.click(screen.getByText("add-code-Travel"));

    await waitFor(() => {
      expect(screen.getByText("Add expense code")).toBeInTheDocument();
    });
  });

  it("calls createCode with correct category id", async () => {
    mockCategories();
    mockCreateCode.mockResolvedValue({});

    render(<ExpenseList />, { wrapper });

    await userEvent.click(screen.getByText("add-code-Travel"));
    await waitFor(() => screen.getByText("Add expense code"));

    await userEvent.type(screen.getByPlaceholderText("e.g. T001"), "T001");
    await userEvent.click(screen.getByText("Add"));

    expect(mockCreateCode).toHaveBeenCalledWith(
      expect.objectContaining({ id: "cat-1" }),
    );
  });
});
