import "@testing-library/jest-dom/vitest";

// ─── Polyfills for jsdom (required by Radix UI components) ───

// ResizeObserver is used by @radix-ui/react-use-size
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver =
  ResizeObserverStub as unknown as typeof ResizeObserver;

// Radix Dialog uses pointer-capture APIs
if (!HTMLElement.prototype.hasPointerCapture) {
  HTMLElement.prototype.hasPointerCapture = () => false;
}
if (!HTMLElement.prototype.setPointerCapture) {
  HTMLElement.prototype.setPointerCapture = () => {};
}
if (!HTMLElement.prototype.releasePointerCapture) {
  HTMLElement.prototype.releasePointerCapture = () => {};
}

// Radix Dialog calls element.scrollTo
if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = () => {};
}
