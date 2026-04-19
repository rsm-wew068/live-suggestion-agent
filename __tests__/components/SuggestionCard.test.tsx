import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import SuggestionCard from "@/components/SuggestionCard";
import { Suggestion } from "@/lib/types";

const baseSuggestion: Suggestion = {
  id: "1",
  type: "QUESTION",
  preview: "What is the main bottleneck?",
  detail_prompt: "Explain bottlenecks",
};

describe("SuggestionCard", () => {
  it("renders the preview text", () => {
    render(
      <SuggestionCard suggestion={baseSuggestion} fresh={true} onClick={jest.fn()} />
    );
    expect(screen.getByText("What is the main bottleneck?")).toBeInTheDocument();
  });

  it.each([
    ["QUESTION", "question", "Question to ask"],
    ["TALKING_POINT", "talking", "Talking point"],
    ["ANSWER", "answer", "Answer"],
    ["FACT_CHECK", "fact", "Fact-check"],
    ["CLARIFICATION", "question", "Clarification"],
  ] as const)(
    "renders type tag with correct class for %s",
    (type, cssClass, label) => {
      render(
        <SuggestionCard
          suggestion={{ ...baseSuggestion, type }}
          fresh={true}
          onClick={jest.fn()}
        />
      );
      const tag = screen.getByText(label);
      expect(tag).toHaveClass(cssClass);
    }
  );

  it("calls onClick when clicked", () => {
    const onClick = jest.fn();
    render(
      <SuggestionCard suggestion={baseSuggestion} fresh={true} onClick={onClick} />
    );
    fireEvent.click(screen.getByText("What is the main bottleneck?"));
    expect(onClick).toHaveBeenCalledWith(baseSuggestion);
  });

  it("applies fresh class when fresh=true", () => {
    const { container } = render(
      <SuggestionCard suggestion={baseSuggestion} fresh={true} onClick={jest.fn()} />
    );
    expect(container.firstChild).toHaveClass("fresh");
    expect(container.firstChild).not.toHaveClass("stale");
  });

  it("applies stale class when fresh=false", () => {
    const { container } = render(
      <SuggestionCard suggestion={baseSuggestion} fresh={false} onClick={jest.fn()} />
    );
    expect(container.firstChild).toHaveClass("stale");
    expect(container.firstChild).not.toHaveClass("fresh");
  });
});
