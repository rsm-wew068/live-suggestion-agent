import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatPanel from "@/components/ChatPanel";
import { ChatMessage } from "@/lib/types";

describe("ChatPanel", () => {
  const baseMessages: ChatMessage[] = [
    {
      id: "1",
      role: "user",
      content: "What about sharding?",
      timestamp: "12:00:00",
      suggestionLabel: "Question to ask",
    },
    {
      id: "2",
      role: "assistant",
      content: "Sharding by user cohort works well...",
      timestamp: "12:00:01",
    },
  ];

  it("renders empty state when no messages", () => {
    render(<ChatPanel messages={[]} onSend={jest.fn()} streaming={false} />);
    expect(
      screen.getByText("Click a suggestion or type a question below.")
    ).toBeInTheDocument();
  });

  it("renders chat messages with correct roles", () => {
    render(<ChatPanel messages={baseMessages} onSend={jest.fn()} streaming={false} />);

    expect(screen.getByText("You · Question to ask")).toBeInTheDocument();
    expect(screen.getByText("What about sharding?")).toBeInTheDocument();
    expect(screen.getByText("Assistant")).toBeInTheDocument();
    expect(screen.getByText("Sharding by user cohort works well...")).toBeInTheDocument();
  });

  it("shows user label without suggestion type for typed messages", () => {
    const messages: ChatMessage[] = [
      {
        id: "1",
        role: "user",
        content: "Hello",
        timestamp: "12:00:00",
      },
    ];
    render(<ChatPanel messages={messages} onSend={jest.fn()} streaming={false} />);
    expect(screen.getByText("You")).toBeInTheDocument();
  });

  it("sends message on Enter key", async () => {
    const onSend = jest.fn();
    render(<ChatPanel messages={[]} onSend={onSend} streaming={false} />);

    const input = screen.getByPlaceholderText("Ask anything…");
    await userEvent.type(input, "What is Kafka?{Enter}");

    expect(onSend).toHaveBeenCalledWith("What is Kafka?");
  });

  it("disables input and button when streaming", () => {
    render(<ChatPanel messages={[]} onSend={jest.fn()} streaming={true} />);

    expect(screen.getByPlaceholderText("Ask anything…")).toBeDisabled();
    expect(screen.getByText("Send")).toBeDisabled();
  });

  it("does not send empty messages", async () => {
    const onSend = jest.fn();
    render(<ChatPanel messages={[]} onSend={onSend} streaming={false} />);

    fireEvent.keyDown(screen.getByPlaceholderText("Ask anything…"), {
      key: "Enter",
    });
    expect(onSend).not.toHaveBeenCalled();
  });
});
