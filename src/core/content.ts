import type { WebExtConfig } from '../plugin/releases.js';
import { readConfig } from '../plugin/releases.js';

type BackgroundRequest =
  | { type: 'FETCH_BUNDLE'; config: WebExtConfig }
  | { type: 'INJECT_BUNDLE'; source: string }
  | { type: 'REGISTER_PLUGIN' };

interface BackgroundReply {
  source?: string;
  ok?: boolean;
  error?: string;
}

async function sendMessage(request: BackgroundRequest): Promise<BackgroundReply> {
  const runtime = globalThis.browser?.runtime ?? globalThis.chrome?.runtime;
  if (!runtime) throw new Error('Extension runtime unavailable');

  const response: BackgroundReply | undefined = await runtime.sendMessage(request);
  if (!response) throw new Error(`No reply to ${request.type}`);
  if (response.error) throw new Error(response.error);
  return response;
}

async function requireAcknowledgement(
  request: Exclude<BackgroundRequest, { type: 'FETCH_BUNDLE' }>,
) {
  const response = await sendMessage(request);
  if (response.ok !== true) throw new Error(`Missing acknowledgement for ${request.type}`);
}

async function loadBundle(canRetry: boolean): Promise<void> {
  try {
    const { source } = await sendMessage({ type: 'FETCH_BUNDLE', config: readConfig() });
    if (!source) throw new Error('Background returned an empty client bundle');
    await requireAcknowledgement({ type: 'INJECT_BUNDLE', source });
  } catch (error) {
    console.warn('[yapmod-web] Failed to load bundle:', error);
    if (canRetry) globalThis.setTimeout(() => void loadBundle(false), 60_000);
    return;
  }

  console.log('[yapmod-web] Bundle injected successfully');
  // The client is already running. A settings failure should leave it running once.
  try {
    await requireAcknowledgement({ type: 'REGISTER_PLUGIN' });
  } catch (error) {
    console.warn('[yapmod-web] Failed to register settings plugin:', error);
  }
}

void loadBundle(true);
