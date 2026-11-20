// Shared core: Blob URL script injection helper
// Executes the fetched Yapmod bundle in the page's JS context.
// Uses a Blob URL to avoid CSP violations that block inline <script> tags.
// Returns a promise that resolves when the script has loaded.

export function injectBundle(sourceCode: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([sourceCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const script = document.createElement('script');
    script.src = url;
    script.addEventListener('load', () => {
      document.head.removeChild(script);
      URL.revokeObjectURL(url);
      resolve();
    });
    script.addEventListener('error', () => {
      console.error('[yapmod-web] Injection failed');
      document.head.removeChild(script);
      URL.revokeObjectURL(url);
      reject(new Error('Script injection failed'));
    });
    document.head.appendChild(script);
  });
}
