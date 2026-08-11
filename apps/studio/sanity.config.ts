import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemaTypes";

/**
 * Studio configuration.
 *
 * No `basePath` here, unlike the embedded attempt: a deployed Studio owns the
 * root of its own *.sanity.studio host.
 *
 * The project ID and dataset are not secrets - both already ship inside the
 * public web bundle, because the browser needs them to query the (deliberately
 * public) dataset. They are written literally so `sanity deploy` works without
 * environment setup, with SANITY_STUDIO_* overrides for anyone pointing this
 * at a different project.
 */
export default defineConfig({
  name: "esquinazo",
  title: "Esquinazo Wire",

  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? "jqhhqpia",
  dataset: process.env.SANITY_STUDIO_DATASET ?? "production",

  plugins: [structureTool(), visionTool()],

  schema: { types: schemaTypes },
});
