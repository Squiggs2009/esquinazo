/**
 * Bundles each handler into dist/<function>/index.js.
 *
 * The Terraform lambda module zips dist/<function>/ per function and expects
 * the entrypoint at index.handler, so the directory layout here is a contract
 * with infra/environments/dev/main.tf (var.lambda_source_dir).
 */
import { build } from "esbuild";
import { rm } from "node:fs/promises";

/** Must stay in sync with the functions map in the dev environment. */
const FUNCTIONS = ["fixtures", "standings", "players", "transfers", "refresh", "news"];

await rm("dist", { recursive: true, force: true });

await Promise.all(
  FUNCTIONS.map((name) =>
    build({
      entryPoints: [`src/handlers/${name}.ts`],
      outfile: `dist/${name}/index.js`,
      bundle: true,
      platform: "node",
      // Matches the nodejs22.x runtime and arm64 architecture in Terraform.
      target: "node22",
      // CJS so `export const handler` becomes exports.handler for index.handler.
      format: "cjs",
      // The AWS SDK ships with the runtime, but bundling it keeps deploys
      // reproducible instead of drifting with runtime patch releases.
      external: [],
      // Paired with NODE_OPTIONS=--enable-source-maps in the Lambda env.
      sourcemap: true,
      sourcesContent: false,
      minify: false,
      treeShaking: true,
      legalComments: "none",
      logLevel: "info",
    }),
  ),
);

console.log(`Bundled ${FUNCTIONS.length} functions into dist/`);
