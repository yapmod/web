// Shared core: dynamic script tag injection helper
// Executes the fetched Yapmod bundle in the page's JS context.
// Returns a promise that resolves when the script has loaded.

export function injectBundle(sourceCode: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.textContent = sourceCode;
    script.addEventListener("load", () => {
      document.head.removeChild(script);
      resolve();
    });
    script.addEventListener("error", () => {
      console.error("[yapmod-web] Injection failed");
      document.head.removeChild(script);
      reject(new Error("Script injection failed"));
    });
    document.head.appendChild(script);
  });
}
