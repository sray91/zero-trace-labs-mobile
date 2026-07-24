import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./users";
import { BROKER_SEED, riskForTier } from "./brokerSeed";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("dataSources")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

// Editable catalog fields, shared by create + update. Tier drives riskLevel.
const catalogFields = {
  name: v.string(),
  category: v.optional(v.string()),
  tier: v.optional(v.number()), // 1 = Crucial, 2 = High, 3 = Standard
  searchUrl: v.optional(v.string()),
  optOutUrl: v.optional(v.string()),
  optOutMethod: v.optional(v.string()),
  difficulty: v.optional(v.string()), // Easy | Medium | Hard
  estProcessingDays: v.optional(v.number()),
  alsoCovers: v.optional(v.string()),
  parentCompany: v.optional(v.string()),
  instructions: v.optional(v.string()),
};

// Add a broker to the catalog. Admin only.
export const create = mutation({
  args: catalogFields,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const tier = args.tier ?? 3;
    return await ctx.db.insert("dataSources", {
      ...args,
      tier,
      url: args.searchUrl ?? args.optOutUrl ?? "",
      riskLevel: riskForTier(tier),
      dataTypes: [],
      isActive: true,
    });
  },
});

// Edit an existing broker. Admin only.
export const update = mutation({
  args: { id: v.id("dataSources"), ...catalogFields },
  handler: async (ctx, { id, ...fields }) => {
    await requireAdmin(ctx);
    const tier = fields.tier ?? 3;
    await ctx.db.patch(id, {
      ...fields,
      tier,
      url: fields.searchUrl ?? fields.optOutUrl ?? "",
      riskLevel: riskForTier(tier),
    });
    return id;
  },
});

// Inline edit of just the search / opt-out URLs, used from the per-user broker panel
// so admins can correct a bad link without leaving the page. Narrow on purpose: unlike
// `update` it touches only the two URL fields (+ derived legacy `url`), leaving tier,
// category, difficulty, etc. untouched. Admin only.
export const setUrls = mutation({
  args: {
    id: v.id("dataSources"),
    searchUrl: v.optional(v.string()),
    optOutUrl: v.optional(v.string()),
  },
  handler: async (ctx, { id, searchUrl, optOutUrl }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, {
      searchUrl,
      optOutUrl,
      url: searchUrl ?? optOutUrl ?? "",
    });
    return id;
  },
});

// Remove a broker from the catalog. Soft-delete (isActive: false) to preserve
// referential integrity with per-user brokerExposures rows. Admin only.
export const remove = mutation({
  args: { id: v.id("dataSources") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { isActive: false });
    return id;
  },
});

// Seed/refresh the full 93-broker catalog from convex/brokerSeed.ts. Idempotent:
// upserts by name. Run once: `npx convex run dataSources:seedBrokers`.
export const seedBrokers = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("dataSources").collect();
    const byName = new Map(existing.map((d) => [d.name, d]));
    const seedNames = new Set(BROKER_SEED.map((b) => b.name));

    let added = 0;
    let updated = 0;
    let deactivated = 0;

    // Retire legacy/duplicate rows not in the canonical catalog so counts stay exact.
    for (const row of existing) {
      if (!seedNames.has(row.name) && row.isActive) {
        await ctx.db.patch(row._id, { isActive: false });
        deactivated++;
      }
    }

    for (const b of BROKER_SEED) {
      const fields = {
        url: b.searchUrl ?? b.optOutUrl ?? "",
        riskLevel: riskForTier(b.tier),
        isActive: true,
        tier: b.tier,
        category: b.category,
        searchUrl: b.searchUrl,
        optOutUrl: b.optOutUrl,
        optOutMethod: b.optOutMethod,
        difficulty: b.difficulty,
        estProcessingDays: b.estProcessingDays,
        alsoCovers: b.alsoCovers,
        parentCompany: b.parentCompany,
        instructions: b.instructions,
      };

      const current = byName.get(b.name);
      if (current) {
        await ctx.db.patch(current._id, fields);
        updated++;
      } else {
        await ctx.db.insert("dataSources", {
          name: b.name,
          dataTypes: [],
          ...fields,
        });
        added++;
      }
    }
    return { added, updated, deactivated, total: BROKER_SEED.length };
  },
});
