// Web extension plugin: provides settings for configuring which Yapmod
// client version to install, and whether to allow pre-releases.
//
// Registered via globalThis.YapmodClient.registerClientPlugin() after
// the Yapmod bundle loads. Uses the shared Solid instance (api.solid)
// for reactive UI, and createComponent(Dynamic) for element creation
// without JSX transform.

import { readConfig, writeConfig, getReleaseList } from "./releases.js";

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
      description: "Configure which Yapmod client version to install",
    },
    setup(api: any) {
      const { solid, solidWeb } = api;

      // Read initial config
      let config = readConfig();

      // Fetch releases list for the dropdown
      let releases: { tagName: string; prerelease: boolean }[] = [];
      getReleaseList(config).then((list) => {
        releases = list;
      });

      // Helper: create a Solid element using Dynamic component
      const el = (tag: string, props: Record<string, any> | null, ...children: any[]) => {
        const p: Record<string, any> = props ? { ...props } : {};
        if (children.length > 0) {
          p.children = children.length === 1 ? children[0] : children;
        }
        return solidWeb.createComponent(solidWeb.Dynamic, {
          component: tag,
          ...p,
        });
      };

      // Register settings section
      api.settings.registerSection({
        id: "web-ext-config",
        label: "Extension",
        render() {
          // Re-read config reactively via storage
          const version = api.storage.version || "latest";
          const includePrereleases = api.storage.includePrereleases || false;

          // Fetch releases when the section opens
          solid.createEffect(() => {
            getReleaseList({ version: "latest", includePrereleases }).then((list) => {
              releases = list;
            });
          });

          const handleVersionChange = (e: Event) => {
            const target = e.target as HTMLSelectElement;
            const newVersion = target.value;
            config = { ...config, version: newVersion };
            writeConfig(config);
            api.storage.version = newVersion;
            api.flushStorage();
          };

          const handlePrereleaseChange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const newIncludePrereleases = target.checked;
            config = { ...config, includePrereleases: newIncludePrereleases };
            writeConfig(config);
            api.storage.includePrereleases = newIncludePrereleases;
            api.flushStorage();

            // Refresh release list when toggle changes
            getReleaseList(config).then((list) => {
              releases = list;
            });
          };

          // Sync storage with localStorage config on mount
          solid.createEffect(() => {
            api.storage.version = config.version;
            api.storage.includePrereleases = config.includePrereleases;
          });

          return el(
            "div",
            { style: "display: flex; flex-direction: column; gap: 16px;" },
            el(
              "div",
              null,
              el(
                "label",
                {
                  style: "display: block; font-weight: 600; margin-bottom: 4px;",
                },
                "Version",
              ),
              el(
                "select",
                {
                  value: version,
                  onChange: handleVersionChange,
                  style:
                    "width: 100%; padding: 8px; border-radius: 4px; " +
                    "border: 1px solid #ccc; background: #fff;",
                },
                el("option", { value: "latest" }, "Latest stable"),
                ...releases.map((r) =>
                  el(
                    "option",
                    { value: r.tagName },
                    `${r.tagName}${r.prerelease ? " (pre-release)" : ""}`,
                  ),
                ),
              ),
            ),
            el(
              "div",
              null,
              el(
                "label",
                {
                  style: "display: flex; align-items: center; gap: 8px; cursor: pointer;",
                },
                el("input", {
                  type: "checkbox",
                  checked: includePrereleases,
                  onChange: handlePrereleaseChange,
                }),
                "Include pre-releases",
              ),
            ),
            el(
              "p",
              {
                style: "font-size: 12px; color: #888; margin: 0;",
              },
              "Changes take effect on the next page reload.",
            ),
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
