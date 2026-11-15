// Type shim for @yapmod/ui — the package is not published to npm, but the
// build pipeline (Babel transforms) rewrites these imports to use the shared
// YapmodClient instance. This declaration satisfies TypeScript typecheck.
declare module "@yapmod/ui" {
  import type { Component } from "solid-js";

  export const Select: Component<{
    options: readonly { value: string; label: string; disabled?: boolean }[];
    value?: string;
    onChange?: (value: string) => void;
    style?: Record<string, string | number>;
  }>;
  export const Hint: Component<{
    children?: import("solid-js").JSX.Element;
    style?: Record<string, string | number>;
  }>;
  export const SettingsPage: Component<{
    title: string;
    description?: string;
    children?: import("solid-js").JSX.Element;
  }>;
  export const Section: Component<{
    label: string;
    children?: import("solid-js").JSX.Element;
  }>;
  export const SettingRow: Component<{
    label: string;
    hint?: string;
    children?: import("solid-js").JSX.Element;
  }>;
}

