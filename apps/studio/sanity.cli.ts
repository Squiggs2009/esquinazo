import { defineCliConfig } from "sanity/cli";

/**
 * CLI configuration for `sanity deploy`.
 *
 * `studioHost` fixes the deployed hostname at <studioHost>.sanity.studio. It is
 * set here rather than left blank because the CLI otherwise prompts for it
 * interactively on first deploy. The name is claimed globally across all Sanity
 * accounts, so a taken one fails the deploy and has to be changed here.
 */
export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? "jqhhqpia",
    dataset: process.env.SANITY_STUDIO_DATASET ?? "production",
  },
  studioHost: "esquinazo",
  // Pinned so future `sanity deploy` runs don't prompt for it.
  deployment: {
    appId: "dj42zx5ay0eizoocm50943du",
  },
});
