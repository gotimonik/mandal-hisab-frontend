import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/app/status-badge";
import { Field, FormError } from "@/components/app/field";
import { Money } from "@/components/app/money";

describe("components", () => {
  it("renders status labels in readable form", () => {
    render(<StatusBadge status="partially_paid" />);
    expect(screen.getByText("partially paid")).toBeInTheDocument();
  });
  it("shows field errors with role=alert", () => {
    render(
      <Field label="Amount" htmlFor="amt" error="Amount must be greater than zero">
        <input id="amt" />
      </Field>,
    );
    expect(screen.getByLabelText("Amount")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("greater than zero");
  });
  it("hides empty form errors and formats money", () => {
    const { container } = render(<FormError message={null} />);
    expect(container).toBeEmptyDOMElement();
    render(<Money paise={12500050} />);
    expect(screen.getByText("₹1,25,000.50")).toBeInTheDocument();
  });
});
