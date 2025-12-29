// Extend ImportMeta type to include env property for Vite/Bun compatibility
declare global {
  // We need to use interface here to extend the global ImportMeta type
  /* eslint-disable-next-line */
  interface ImportMeta {
    env?: Record<string, string | undefined>;
  }
}

export {};
