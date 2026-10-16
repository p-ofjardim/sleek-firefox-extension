import { describe, it, expect, beforeAll } from "vitest";
import { render, waitFor } from "@testing-library/react";
import "./mockApi";
import App from "../renderer/App";

describe("extension web build (mocked window.api)", () => {
  beforeAll(() => {
    window.innerWidth = 1920;
    window.innerHeight = 1080;
  });

  it("renders the app shell and grid against the mocked API", async () => {
    render(<App />);
    await waitFor(() => {
      expect(document.getElementById("grid")).toBeInTheDocument();
    });
    expect(document.getElementById("grid")).not.toBeEmptyDOMElement();
  });

  it("serves todo data through the mock requestData channel", async () => {
    render(<App />);
    await waitFor(() => {
      expect(document.getElementById("grid")).toBeInTheDocument();
    });
    const grid = document.getElementById("grid")!;
    await waitFor(() => {
      expect(grid.textContent).toContain("Pay rent");
    });
    expect(grid.textContent).toContain("Read about WebExtensions");
  });
});
