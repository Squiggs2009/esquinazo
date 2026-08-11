import { defineField, defineType } from "sanity";

/**
 * A Wire entry - one published piece of writing.
 *
 * IMPORTANT: this schema was reconstructed from the GROQ projections that
 * already read these documents (apps/api/src/lib/sanity.ts and
 * apps/web/src/lib/sanity.ts), not copied from a pre-existing definition - the
 * repo never contained one. A Sanity dataset is schemaless, so this file only
 * drives the Studio UI and its validation: if it disagrees with the shape the
 * existing documents were authored under, editors here will silently write
 * different documents than the ones already in the dataset. Reconcile against
 * a real published entry before relying on it.
 *
 * Two fields are required because the publish pipeline filters on them -
 * `defined(slug.current) && defined(publishedAt)` - so an entry missing either
 * is invisible to both the static /news page and the archive.
 */
export const wireEntry = defineType({
  name: "wireEntry",
  title: "Wire entry",
  type: "document",
  fields: [
    defineField({
      name: "headline",
      title: "Headline",
      type: "string",
      validation: (rule) => rule.required().max(160),
    }),

    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "The URL segment: /news/<slug>. Changing it orphans the old page.",
      options: { source: "headline", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "heroImage",
      title: "Hero image",
      type: "image",
      description:
        "Optional. Shown near the top of the entry page and as a thumbnail on the Wire listing. " +
        "Hotspot is on because Canva exports arrive at whatever aspect ratio they arrive at - " +
        "dragging the hotspot onto the subject keeps the listing's forced-square crop sensible " +
        "even when the source image isn't square. Entries without one render exactly as they do " +
        "today, nothing degrades.",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
          description: "For screen readers, and shown if the image fails to load.",
        }),
      ],
    }),

    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      description: "Drives ordering. Entries without a date are never listed.",
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "contentType",
      title: "Type",
      type: "string",
      options: {
        list: [
          { title: "News", value: "news" },
          { title: "Opinion", value: "opinion" },
        ],
        layout: "radio",
      },
      initialValue: "news",
    }),

    defineField({
      name: "language",
      title: "Language",
      type: "string",
      options: {
        list: [
          { title: "English", value: "en" },
          { title: "Español", value: "es" },
        ],
        layout: "radio",
      },
      initialValue: "en",
    }),

    defineField({
      name: "body",
      title: "Body",
      // Plain multi-line text, not Portable Text - no block editor, no marks.
      // `text` rather than `string`: string's Studio default caps input at 200
      // characters, too short for an opinion piece. renderBody() and
      // bodyToPlainText() in apps/api/src/lib/wire-html.ts already branch on
      // `typeof body === "string"` (splitting on blank lines into paragraphs),
      // so this needs no change on the Lambda side.
      type: "text",
      rows: 8,
      validation: (rule) => rule.max(2000),
    }),

    defineField({
      name: "sourceLabel",
      title: "Source label",
      type: "string",
      description: "Attribution shown under the headline, e.g. 'Récord'.",
    }),

    defineField({
      name: "sourceUrl",
      title: "Source URL",
      type: "url",
      // Mirrors safeUrl() in the page renderer, which drops anything that is
      // not http/https rather than emitting it into an href.
      validation: (rule) => rule.uri({ scheme: ["http", "https"] }),
    }),

    defineField({
      name: "relatedPlayer",
      title: "Related player",
      type: "object",
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: "playerId", title: "API-Football player ID", type: "number" }),
        defineField({ name: "name", title: "Name", type: "string" }),
      ],
    }),

    defineField({
      name: "relatedTeam",
      title: "Related team",
      type: "object",
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: "teamId", title: "API-Football team ID", type: "number" }),
        defineField({ name: "name", title: "Name", type: "string" }),
        defineField({
          name: "leagueId",
          title: "Competition",
          description:
            "Which league this team plays in. Needed to deep-link the Wire entry straight to " +
            "the player's stat card on /players - without it the site's default league (Premier " +
            "League) is searched instead, and the link silently misses any team playing elsewhere.",
          type: "number",
          options: {
            // Mirrors LEAGUES in apps/web/src/lib/api.ts. Kept as a fixed list
            // rather than free entry so an editor cannot typo an id the site
            // does not actually configure.
            list: [
              { title: "Premier League (England)", value: 39 },
              { title: "Championship (England)", value: 40 },
              { title: "La Liga (Spain)", value: 140 },
              { title: "Serie A (Italy)", value: 135 },
              { title: "Bundesliga (Germany)", value: 78 },
              { title: "Ligue 1 (France)", value: 61 },
              { title: "Champions League (Europe)", value: 2 },
              { title: "Eredivisie (Netherlands)", value: 88 },
              { title: "Primeira Liga (Portugal)", value: 94 },
              { title: "Liga MX (Mexico)", value: 262 },
              { title: "MLS (United States)", value: 253 },
              { title: "Leagues Cup (North America)", value: 772 },
            ],
          },
        }),
      ],
    }),
  ],

  orderings: [
    {
      title: "Newest first",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],

  preview: {
    select: { title: "headline", contentType: "contentType", publishedAt: "publishedAt" },
    prepare({ title, contentType, publishedAt }) {
      const date = publishedAt ? new Date(publishedAt).toLocaleDateString() : "unpublished";
      return { title, subtitle: `${contentType ?? "news"} · ${date}` };
    },
  },
});
