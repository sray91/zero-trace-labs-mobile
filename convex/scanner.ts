"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { ApifyClient } from "apify-client";

// apivault_labs/skip-trace-people-finder — best-rated US people-search /
// skip-trace actor (5.0★). Drop-in input shape: name / street_citystatezip /
// phone_number / email / max_results. Aggregates current + past addresses,
// phones, relatives, aliases and a profile link.
const SKIP_TRACE_ACTOR = "apivault_labs/skip-trace-people-finder";

const isEmpty = (val: unknown) =>
  val === null ||
  val === undefined ||
  val === "" ||
  val === "Person Not Found" ||
  (Array.isArray(val) && val.length === 0);

// Master Tracker data categories, detected from the actor's output keys. The
// exact field names vary by actor, so we match key patterns and only count a
// category when the field actually holds a value.
const CATEGORY_PATTERNS: Array<{ label: string; re: RegExp }> = [
  { label: "Name", re: /(^|_| )(name|first|last|alias|aka)/i },
  { label: "Age", re: /(age|born|birth|dob)/i },
  { label: "Address", re: /(address|street|city|state|zip|postal|lives|county)/i },
  { label: "Address History", re: /(previous|prior|past).*(address)|address.*(history)/i },
  { label: "Phone", re: /phone|tel|mobile|cell/i },
  { label: "Email", re: /email/i },
  { label: "Relatives", re: /relativ|associate|family|household/i },
  { label: "Social Media", re: /social|facebook|linkedin|instagram|twitter/i },
];

const LINK_RE = /(person.?link|profile.?url|profile.?link|listing.?url|^link$|^url$)/i;

// Reduce raw actor items to the data categories found + a representative
// profile link, regardless of the actor's exact output shape.
function summarize(items: Array<Record<string, unknown>>) {
  const categories = new Set<string>();
  let personLink: string | undefined;

  for (const item of items) {
    for (const [key, value] of Object.entries(item)) {
      if (isEmpty(value)) continue;
      for (const { label, re } of CATEGORY_PATTERNS) {
        if (re.test(key)) categories.add(label);
      }
      if (
        !personLink &&
        LINK_RE.test(key) &&
        typeof value === "string" &&
        value.startsWith("http")
      ) {
        personLink = value;
      }
    }
  }

  return { categories: Array.from(categories), personLink };
}

// Admin-triggered baseline scan. Pulls the user's profile, runs the Apify
// skip-trace actor, then persists results into searchHistory + brokerExposures
// (see scannerInternal.persistScan). Admin auth is enforced in getScanContext,
// which runs before any Apify spend.
export const runBaselineScan = action({
  args: { userId: v.id("users"), maxResults: v.optional(v.number()) },
  handler: async (ctx, { userId, maxResults }) => {
    const { name, email, profile, targets } = await ctx.runQuery(
      internal.scannerInternal.getScanContext,
      { userId }
    );

    const fullName =
      [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim() ||
      (name ?? "").trim();
    if (!fullName) {
      throw new Error(
        "This user has no name on file. Add a first/last name to their profile before scanning."
      );
    }

    const address = [
      profile?.addressLine1,
      profile?.city,
      profile?.state,
      profile?.zipCode,
    ]
      .filter(Boolean)
      .join(", ");
    const phone = profile?.phoneNumber || undefined;
    const lookupEmail = email || undefined;

    const token = process.env.APIFY_API_TOKEN;
    if (!token) throw new Error("APIFY_API_TOKEN is not configured");

    const client = new ApifyClient({ token });
    const input = {
      max_results: maxResults ?? 5,
      name: [fullName],
      street_citystatezip: address ? [address] : [],
      phone_number: phone ? [phone] : [],
      email: lookupEmail ? [lookupEmail] : [],
    };

    const run = await client.actor(SKIP_TRACE_ACTOR).call(input);
    const { items } = await client
      .dataset(run.defaultDatasetId)
      .listItems();

    const { categories, personLink } = summarize(
      items as Array<Record<string, unknown>>
    );
    const searchTerm = [fullName, address].filter(Boolean).join(" · ");

    const result = await ctx.runMutation(internal.scannerInternal.persistScan, {
      userId,
      targetSourceIds: targets.map((t) => t._id),
      searchTerm,
      recordCount: items.length,
      categories,
      personLink,
      rawResults: items,
      fullName,
      phone,
      email: lookupEmail,
    });

    return {
      ...result,
      actorRunId: run.id,
      categories,
      brokers: targets.map((t) => t.name),
    };
  },
});
