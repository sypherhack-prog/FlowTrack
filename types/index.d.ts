// types/index.d.ts
export {};

declare global {
  interface Window {
    html2canvas?: (element: HTMLElement, options?: unknown) => Promise<HTMLCanvasElement>;
  }
}