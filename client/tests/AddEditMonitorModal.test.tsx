import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddEditMonitorModal } from "@/components/monitors/AddEditMonitorModal";

// ─── Mock monitorApi ───
const mockCreate = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/api/monitorApi", () => ({
  monitorApi: {
    create: (...args: unknown[]) => mockCreate(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    list: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
  },
}));

// ─── Mock sonner ───
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function renderModal(
  props: Partial<Parameters<typeof AddEditMonitorModal>[0]> = {},
) {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    monitor: null,
    onSuccess: vi.fn(),
  };
  return {
    ...render(<AddEditMonitorModal {...defaultProps} {...props} />),
    props: { ...defaultProps, ...props },
  };
}

describe("AddEditMonitorModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockReset();
    mockUpdate.mockReset();
  });

  it("renders the form with all required fields", () => {
    renderModal();

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/url/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add monitor/i }),
    ).toBeInTheDocument();
  });

  it("shows validation error when name is empty", async () => {
    renderModal();
    const user = userEvent.setup();

    // Fill URL but leave name empty
    const urlInput = screen.getByLabelText(/url/i);
    await user.clear(urlInput);
    await user.type(urlInput, "https://api.example.com");

    // Submit
    await user.click(screen.getByRole("button", { name: /add monitor/i }));

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("shows validation error when URL is invalid", async () => {
    renderModal();
    const user = userEvent.setup();

    // Fill name but use an invalid URL
    const nameInput = screen.getByLabelText(/name/i);
    const urlInput = screen.getByLabelText(/url/i);
    await user.type(nameInput, "My Monitor");
    await user.clear(urlInput);
    await user.type(urlInput, "not-a-valid-url");

    await user.click(screen.getByRole("button", { name: /add monitor/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid url/i)).toBeInTheDocument();
    });

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("calls monitorApi.create on valid submit", async () => {
    mockCreate.mockResolvedValueOnce({
      id: "new-1",
      name: "Test",
      status: "pending",
    });
    const onSuccess = vi.fn();
    const onOpenChange = vi.fn();
    renderModal({ onSuccess, onOpenChange });
    const user = userEvent.setup();

    const nameInput = screen.getByLabelText(/name/i);
    const urlInput = screen.getByLabelText(/url/i);

    await user.type(nameInput, "New Monitor");
    await user.clear(urlInput);
    await user.type(urlInput, "https://api.example.com/health");

    await user.click(screen.getByRole("button", { name: /add monitor/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Monitor",
          url: "https://api.example.com/health",
        }),
      );
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
