import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
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

export const add = mutation({
  args: {
    name: v.string(),
    url: v.string(),
    apiEndpoint: v.optional(v.string()),
    riskLevel: v.string(),
    description: v.optional(v.string()),
    dataTypes: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("dataSources", {
      name: args.name,
      url: args.url,
      apiEndpoint: args.apiEndpoint,
      riskLevel: args.riskLevel,
      description: args.description,
      dataTypes: args.dataTypes ?? [],
      isActive: args.isActive ?? true,
    });
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
