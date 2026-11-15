// Web extension plugin: provides a single setting to choose the release
// channel (stable or prerelease) for the Yapmod client bundle.
//
// Registered via globalThis.YapmodClient.registerClientPlugin() after
// the Yapmod bundle loads. Uses SolidJS JSX syntax — the build pipeline
// (babel-preset-solid + shared-import rewrite) compiles JSX and rewrites
// solid-js imports to use the shared yapmod instance.

import type { JSX } from "solid-js";
import {Select, Hint, SettingsPage, Section, SettingRow} from "@yapmod/ui"
import type { WebExtConfig } from "./releases.js";
import { readConfig, writeConfig } from "./releases.js";

/**
 * Creates the plugin definition for registerClientPlugin().
 * Returns a ClientPlugin object with id, manifest, and setup(api).
 * The setup function returns a ClientPluginModule with onLoad hook.
 */
export function createWebExtPlugin() {
  return {
    id: "client:web-ext-config",
    manifest: {
      name: "Web Extension Config",
      author: "Yapmod",
      description: "Configure the Yapmod web extension behavior",
    },
    setup(api: any) {
      // Read initial config and sync to plugin storage outside any reactive
      // context so the signal-based storage proxy doesn't create a circular
      // dependency when the render function reads those same properties.
      const config: WebExtConfig = readConfig();
      api.storage.channel = config.channel;
      api.flushStorage();

      // Register settings section with settings icon
      api.settings.registerSection({
        id: "web-ext-config",
        label: "Extension",
        icon: "settings",
        render(): JSX.Element {
          const channel = () => api.storage.channel || "stable";

          // onChange receives the new value directly, not a DOM event.
          const handleChannelChange = (value: string) => {
            const nextChannel = value === "prerelease" ? "prerelease" : "stable";
            writeConfig({ channel: nextChannel });
            api.storage.channel = nextChannel;
            api.flushStorage();
          };

          return (
            <SettingsPage title="Extension" description="Configure the Yapmod web extension behavior">
              <Section label="Release channel">
                <SettingRow label="Channel" hint="Choose which release channel to use for the Yapmod client">
                  <Select
                    value={channel()}
                    onChange={handleChannelChange}
                    options={[
                      { value: "stable", label: "Stable" },
                      { value: "prerelease", label: "Pre-release" },
                    ]}
                    style={{ width: "160px" }}
                  />
                </SettingRow>
              </Section>

              <Hint style={{ marginTop: "0.75rem" }}>Changes take effect on the next page reload.</Hint>
            </SettingsPage>
          );
        },
      });

      return {
        onLoad() {
          api.log("Web extension config plugin loaded");
        },
      };
    },
  };
}
