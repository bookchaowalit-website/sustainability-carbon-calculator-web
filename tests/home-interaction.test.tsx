// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;
const $ = <T extends Element = HTMLElement>(selector: string) => host.querySelector(selector) as T | null;
const button = (text: string, scope: ParentNode = host) => [...scope.querySelectorAll("button")].find((b) => b.textContent?.trim().startsWith(text)) as HTMLButtonElement;
const press = (el: Element, detail = 1) => act(() => { el.dispatchEvent(new MouseEvent("click", { bubbles: true, detail })); });
const rows = () => [...host.querySelectorAll(".as-row h3")].map((h) => h.textContent);
function type(el: HTMLInputElement, value: string) {
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
const blur = (el: Element) => act(() => { el.dispatchEvent(new FocusEvent("focusout", { bubbles: true })); });
const submit = () => act(() => { $("form.as-composer")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
const fields = () => [...host.querySelectorAll<HTMLInputElement>(".as-composer input")];

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => root.render(<Home />));
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
});

describe("composer", () => {
  it("opens focused, explains what is missing, and adds a valid line", () => {
    press(button("New line"));
    const [label, amount] = fields();
    expect(document.activeElement).toBe(label);
    expect(button("Add", $("form.as-composer")!).disabled).toBe(true);
    blur(label);
    blur(amount);
    expect($("#label-error")!.textContent).toContain("Name the activity");
    expect($("#amount-error")!.textContent).toBe("Enter an amount.");
    type(amount, "-3");
    expect($("#amount-error")!.textContent).toContain("more than 0");
    submit(); // invalid submit changes nothing
    expect(rows()).toHaveLength(3);
    type(label, "Train trip");
    press(button("Food", $("form.as-composer")!));
    expect($("form.as-composer")!.textContent).toContain("Amount (servings)");
    press(button("Travel", $("form.as-composer")!));
    type(amount, "100");
    expect($(".ct-hint")!.textContent).toContain("4.0 kg");
    submit();
    expect(rows()).toContain("Train trip");
    expect($("form.as-composer")).toBeNull();
    expect(document.activeElement?.textContent).toContain("New line");
    expect($("[role='status']")!.textContent).toContain("Added “Train trip”");
  });

  it("switches to the new line's category when adding from another list, and Cancel closes", () => {
    press(button("Home", $(".as-side")!));
    expect($("h1")!.textContent).toBe("Home");
    press(button("New line"));
    const [label, amount] = fields();
    type(label, "Bus");
    type(amount, "5");
    press(button("Travel", $("form.as-composer")!));
    submit();
    expect($("h1")!.textContent).toBe("Travel");
    press(button("New line"));
    press(button("Cancel"));
    expect($("form.as-composer")).toBeNull();
  });
});

describe("remove and undo", () => {
  it("removes with an Undo toast that puts the line back in place", () => {
    press($("[aria-label='Remove Grid electricity']")!);
    expect(rows()).not.toContain("Grid electricity");
    press(button("Undo", $(".as-toast")!));
    expect(rows()).toEqual(["Motorbike commute", "Grid electricity", "Rice meal"]);
  });

  it("shows empty states and the toast closes on its own or on Escape", () => {
    vi.useFakeTimers();
    press(button("Food", $(".as-side")!));
    press($("[aria-label='Remove Rice meal']")!, 0);
    expect($(".as-empty")!.textContent).toContain("No Food lines");
    act(() => { vi.runOnlyPendingTimers(); });
    act(() => { vi.runOnlyPendingTimers(); });
    expect($(".as-toast")).toBeNull();
    press(button("Show all lines"));
    press($("[aria-label='Remove Motorbike commute']")!);
    const toast = $(".as-toast")!;
    act(() => { toast.dispatchEvent(new FocusEvent("focusin", { bubbles: true })); });
    act(() => { toast.dispatchEvent(new FocusEvent("focusout", { bubbles: true })); });
    act(() => { toast.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
    expect($(".as-toast")).toBeNull();
    press($("[aria-label='Remove Grid electricity']")!);
    expect($(".as-empty")!.textContent).toContain("The ledger is empty");
  });
});
