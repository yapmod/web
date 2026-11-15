/**
 * Local mirror of YapmodPluginApi from @yapmod/types.
 *
 * Once @yapmod/types is published to npm, replace this file with:
 *
 *   import type { YapmodPluginApi } from '@yapmod/types';
 *
 * and add `"@yapmod/types"` to the tsconfig `types` array.
 */

import type { JSX } from 'solid-js';

export type ToastKind = 'success' | 'error';

export interface PluginModalOptions {
  title: string;
  description?: string;
  wide?: boolean;
  content: (close: () => void) => JSX.Element;
  footer?: (close: () => void) => JSX.Element;
  onClose?: () => void;
}

export type IconName =
  | 'settings'
  | 'puzzle'
  | 'trash'
  | 'palette'
  | 'upload'
  | 'refresh'
  | 'plus'
  | 'pencil'
  | 'close';

export interface PluginUi {
  showToast(message: string, kind?: ToastKind): void;
  openModal(options: PluginModalOptions): () => void;
  injectCss(css: string): () => void;
  Button: any;
  Hint: any;
  Panel: any;
  Icon: any;
  Switch: any;
  Input: any;
  Textarea: any;
  Select: any;
  SettingsPage: any;
  Section: any;
  SettingRow: any;
  SettingText: any;
  Divider: any;
}

export interface PluginSettingsSection {
  id: string;
  label: string;
  icon?: IconName;
  render: () => JSX.Element;
}

export interface PluginSettings {
  registerSection(section: PluginSettingsSection): () => void;
}

export interface YapmodPluginApi {
  readonly apiVersion: 1;
  readonly id: string;
  readonly manifest: { name: string; author: string; description: string; version?: string; hash?: string };
  readonly storage: Record<string, unknown>;
  flushStorage(): void;
  log(...args: unknown[]): void;
  observe(selector: string, onFound: (element: Element) => void): () => void;
  readonly ui: PluginUi;
  readonly settings: PluginSettings;
  onDispose(dispose: () => void): void;
  showSettings(): void;
  readonly solid: unknown;
  readonly solidWeb: unknown;
  readonly solidStore: unknown;
}
