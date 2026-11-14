// Shared core: dynamic script tag injection helper
// Executes the fetched Yapmod bundle in the page's JS context.

export function injectBundle(sourceCode: string) {
  const script = document.createElement('script');
  script.textContent = sourceCode;
  script.addEventListener('load', () => {
    document.head.removeChild(script);
  });
  script.addEventListener('error', () => {
    console.error('[yapmod-web] Injection failed');
    document.head.removeChild(script);
  });
  document.head.appendChild(script);
}
