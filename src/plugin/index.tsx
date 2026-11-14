// Web extension plugin: provides settings for configuring the Yapmod
// web extension itself — client version, injection behavior, debugging,
// and host filtering.
//
// Registered via globalThis.YapmodClient.registerClientPlugin() after
// the Yapmod bundle loads. Uses SolidJS JSX syntax — the build pipeline
// (babel-preset-solid + shared-import rewrite) compiles JSX and rewrites
// solid-js imports to use the shared yapmod instance.

import type { JSX } from "solid-js";
import type { WebExtConfig } from "./releases.js";
import { readConfig, writeConfig } from "./releases.js";

/**
 * Creates the plugin definition for registerClientPlugin().
 * Returns a plain object — no eval needed, just a function call.
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
      api.storage.version = config.version;
      api.storage.includePrereleases = config.includePrereleases;
      api.storage.verboseLogging = config.verboseLogging;
      api.storage.autoStart = config.autoStart;
      api.storage.injectionDelay = config.injectionDelay;
      api.storage.allowedHosts = config.allowedHosts;
      api.flushStorage();

      // Shared styles
      const inputStyle =
        "width: 100%; padding: 8px; border-radius: 4px; " +
        "border: 1px solid #ccc; background: #fff; box-sizing: border-box;";
      const labelStyle = "display: block; font-weight: 600; margin-bottom: 4px;";
      const hintStyle = "font-size: 12px; color: #888; margin: 0; margin-top: 2px;";
      const checkboxLabelStyle = "display: flex; align-items: center; gap: 8px; cursor: pointer;";

      // Register settings section
      api.settings.registerSection({
        id: "web-ext-config",
        label: "Extension",
        render(): JSX.Element {
          // Re-read config reactively via storage
          const version = api.storage.version || "latest";
          const includePrereleases = api.storage.includePrereleases || false;
          const verboseLogging = api.storage.verboseLogging || false;
          const autoStart = api.storage.autoStart !== false;
          const injectionDelay = api.storage.injectionDelay || 0;
          const allowedHosts = api.storage.allowedHosts || "";

          const handleVersionChange = (e: Event) => {
            const target = e.target as HTMLSelectElement;
            writeConfig({ version: target.value, includePrereleases: config.includePrereleases, verboseLogging: config.verboseLogging, autoStart: config.autoStart, injectionDelay: config.injectionDelay, allowedHosts: config.allowedHosts });
            api.storage.version = target.value;
            api.flushStorage();
          };

          const handlePrereleaseChange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            writeConfig({ ...config, includePrereleases: target.checked });
            api.storage.includePrereleases = target.checked;
            api.flushStorage();
          };

          const handleVerboseChange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            writeConfig({ ...config, verboseLogging: target.checked });
            api.storage.verboseLogging = target.checked;
            api.flushStorage();
          };

          const handleAutoStartChange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            writeConfig({ ...config, autoStart: target.checked });
            api.storage.autoStart = target.checked;
            api.flushStorage();
          };

          const handleDelayChange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const val = parseInt(target.value, 10);
            const delay = isNaN(val) ? 0 : Math.max(0, val);
            writeConfig({ ...config, injectionDelay: delay });
            api.storage.injectionDelay = delay;
            api.flushStorage();
          };

          const handleHostsChange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            writeConfig({ ...config, allowedHosts: target.value });
            api.storage.allowedHosts = target.value;
            api.flushStorage();
          };

          return (
            <div style="display: flex; flex-direction: column; gap: 16px;">
              {/* --- Version section --- */}
              <div>
                <label style={labelStyle}>Version</label>
                <select value={version} onChange={handleVersionChange} style={inputStyle}>
                  <option value="latest">Latest stable</option>
                </select>
              </div>
              <div>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={includePrereleases}
                    onChange={handlePrereleaseChange}
                  />
                  Include pre-releases
                </label>
              </div>

              {/* --- Behavior section --- */}
              <div style="border-top: 1px solid #eee; padding-top: 8px;">
                <h3 style="margin: 0 0 8px; font-size: 14px;">Behavior</h3>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                  <div>
                    <label style={checkboxLabelStyle}>
                      <input type="checkbox" checked={autoStart} onChange={handleAutoStartChange} />
                      Auto-start Yapmod
                    </label>
                    <p style={hintStyle}>Inject Yapmod automatically on matching pages.</p>
                  </div>
                  <div>
                    <label style={labelStyle}>Injection delay (ms)</label>
                    <input
                      type="number"
                      min="0"
                      value={injectionDelay}
                      onChange={handleDelayChange}
                      style={inputStyle}
                    />
                    <p style={hintStyle}>
                      Delay before injection, useful for debugging race conditions.
                    </p>
                  </div>
                </div>
              </div>

              {/* --- Debugging section --- */}
              <div style="border-top: 1px solid #eee; padding-top: 8px;">
                <h3 style="margin: 0 0 8px; font-size: 14px;">Debugging</h3>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                  <div>
                    <label style={checkboxLabelStyle}>
                      <input
                        type="checkbox"
                        checked={verboseLogging}
                        onChange={handleVerboseChange}
                      />
                      Verbose logging
                    </label>
                    <p style={hintStyle}>Enable detailed console output for troubleshooting.</p>
                  </div>
                </div>
              </div>

              {/* --- Hosts section --- */}
              <div style="border-top: 1px solid #eee; padding-top: 8px;">
                <h3 style="margin: 0 0 8px; font-size: 14px;">Hosts</h3>
                <div>
                  <label style={labelStyle}>Additional allowed hosts</label>
                  <input
                    type="text"
                    placeholder="localhost:3000, 127.0.0.1:8080"
                    value={allowedHosts}
                    onChange={handleHostsChange}
                    style={inputStyle}
                  />
                  <p style={hintStyle}>
                    Comma-separated list of extra hosts where Yapmod should inject.
                  </p>
                </div>
              </div>

              <p style={hintStyle}>Changes take effect on the next page reload.</p>
            </div>
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
