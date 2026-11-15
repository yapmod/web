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

      // Register settings section with settings icon
      api.settings.registerSection({
        id: "web-ext-config",
        label: "Extension",
        icon: "settings",
        render(): JSX.Element {
          const Switch = api.ui.Switch;
          const Input = api.ui.Input;
          const Select = api.ui.Select;
          const Hint = api.ui.Hint;

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

          const sectionStyle = "border-top: 1px solid var(--yp-border, #ffffff12); padding-top: 8px;";
          const headingStyle = "margin: 0 0 8px; font-size: 14px;";

          return (
            <div style="display: flex; flex-direction: column; gap: 16px;">
              {/* --- Version section --- */}
              <Select label="Version" value={version} onChange={handleVersionChange}>
                <option value="latest">Latest stable</option>
              </Select>
              <Switch row label="Include pre-releases" checked={includePrereleases} onChange={handlePrereleaseChange} />

              {/* --- Behavior section --- */}
              <div style={sectionStyle}>
                <h3 style={headingStyle}>Behavior</h3>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                  <Switch row label="Auto-start Yapmod" hint="Inject Yapmod automatically on matching pages." checked={autoStart} onChange={handleAutoStartChange} />
                  <Input label="Injection delay (ms)" type="number" min="0" value={injectionDelay} onChange={handleDelayChange} hint="Delay before injection, useful for debugging race conditions." />
                </div>
              </div>

              {/* --- Debugging section --- */}
              <div style={sectionStyle}>
                <h3 style={headingStyle}>Debugging</h3>
                <Switch row label="Verbose logging" hint="Enable detailed console output for troubleshooting." checked={verboseLogging} onChange={handleVerboseChange} />
              </div>

              {/* --- Hosts section --- */}
              <div style={sectionStyle}>
                <h3 style={headingStyle}>Hosts</h3>
                <Input label="Additional allowed hosts" placeholder="localhost:3000, 127.0.0.1:8080" value={allowedHosts} onChange={handleHostsChange} hint="Comma-separated list of extra hosts where Yapmod should inject." />
              </div>

              <Hint>Changes take effect on the next page reload.</Hint>
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
