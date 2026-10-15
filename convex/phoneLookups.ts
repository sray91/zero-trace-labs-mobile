import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Resolve the Convex user document for the authenticated Clerk identity.
async function getAuthUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .first();
}

// US area code → geographic region mapping (subset of the most common codes).
// Used to give the user a rough idea of where a number is registered.
// This is not exhaustive — area codes cover overlays and VoIP assignments too.
const AREA_CODE_REGIONS: Record<string, string> = {
  "201": "New Jersey (Northeast)",
  "202": "Washington, DC",
  "203": "Connecticut (Southwest)",
  "205": "Alabama (Birmingham)",
  "206": "Washington (Seattle)",
  "207": "Maine",
  "208": "Idaho",
  "209": "California (Central Valley)",
  "210": "Texas (San Antonio)",
  "212": "New York (Manhattan)",
  "213": "California (Los Angeles)",
  "214": "Texas (Dallas)",
  "215": "Pennsylvania (Philadelphia)",
  "216": "Ohio (Cleveland)",
  "217": "Illinois (Springfield)",
  "218": "Minnesota (Duluth)",
  "219": "Indiana (Northwest)",
  "220": "Ohio (Newark/Columbus overlay)",
  "224": "Illinois (Chicago suburbs)",
  "225": "Louisiana (Baton Rouge)",
  "228": "Mississippi (Gulf Coast)",
  "229": "Georgia (Southwest)",
  "231": "Michigan (Northwest)",
  "234": "Ohio (Akron/Canton overlay)",
  "239": "Florida (Southwest)",
  "240": "Maryland (West/South overlay)",
  "248": "Michigan (Oakland County)",
  "251": "Alabama (Mobile)",
  "252": "North Carolina (East)",
  "253": "Washington (Tacoma)",
  "254": "Texas (Waco/Killeen)",
  "256": "Alabama (Huntsville)",
  "260": "Indiana (Fort Wayne)",
  "262": "Wisconsin (Southeast)",
  "267": "Pennsylvania (Philadelphia overlay)",
  "269": "Michigan (Southwest)",
  "270": "Kentucky (West)",
  "272": "Pennsylvania (Scranton overlay)",
  "276": "Virginia (Southwest)",
  "281": "Texas (Houston overlay)",
  "301": "Maryland (West/South)",
  "302": "Delaware",
  "303": "Colorado (Denver)",
  "304": "West Virginia",
  "305": "Florida (Miami)",
  "307": "Wyoming",
  "308": "Nebraska (West)",
  "309": "Illinois (West Central)",
  "310": "California (LA West/South Bay)",
  "312": "Illinois (Chicago)",
  "313": "Michigan (Detroit)",
  "314": "Missouri (St. Louis)",
  "315": "New York (Syracuse/Utica)",
  "316": "Kansas (Wichita)",
  "317": "Indiana (Indianapolis)",
  "318": "Louisiana (North)",
  "319": "Iowa (East)",
  "320": "Minnesota (St. Cloud)",
  "321": "Florida (Orlando/Space Coast)",
  "323": "California (Los Angeles overlay)",
  "325": "Texas (Abilene/San Angelo)",
  "330": "Ohio (Akron/Canton)",
  "331": "Illinois (Chicago suburbs overlay)",
  "334": "Alabama (Montgomery)",
  "336": "North Carolina (Greensboro/Winston-Salem)",
  "337": "Louisiana (Lafayette)",
  "339": "Massachusetts (Boston suburbs overlay)",
  "346": "Texas (Houston overlay)",
  "347": "New York (NYC overlay)",
  "351": "Massachusetts (Northeast overlay)",
  "352": "Florida (Gainesville/Ocala)",
  "360": "Washington (West)",
  "361": "Texas (Corpus Christi)",
  "364": "Kentucky (West overlay)",
  "380": "Ohio (Columbus overlay)",
  "385": "Utah (Salt Lake City overlay)",
  "386": "Florida (Daytona Beach)",
  "401": "Rhode Island",
  "402": "Nebraska (Omaha/Lincoln)",
  "404": "Georgia (Atlanta)",
  "405": "Oklahoma (Oklahoma City)",
  "406": "Montana",
  "407": "Florida (Orlando)",
  "408": "California (San Jose)",
  "409": "Texas (Beaumont/Galveston)",
  "410": "Maryland (Baltimore)",
  "412": "Pennsylvania (Pittsburgh)",
  "413": "Massachusetts (West)",
  "414": "Wisconsin (Milwaukee)",
  "415": "California (San Francisco)",
  "417": "Missouri (Springfield)",
  "419": "Ohio (Toledo)",
  "423": "Tennessee (Chattanooga)",
  "424": "California (LA West overlay)",
  "425": "Washington (Bellevue/Everett)",
  "430": "Texas (Northeast overlay)",
  "432": "Texas (Midland/Odessa)",
  "434": "Virginia (Lynchburg/Charlottesville)",
  "435": "Utah (Outside SLC)",
  "440": "Ohio (Cleveland suburbs)",
  "442": "California (San Diego North overlay)",
  "443": "Maryland (Baltimore overlay)",
  "458": "Oregon (Eugene/Portland overlay)",
  "463": "Indiana (Indianapolis overlay)",
  "469": "Texas (Dallas overlay)",
  "470": "Georgia (Atlanta overlay)",
  "475": "Connecticut (Southwest overlay)",
  "478": "Georgia (Macon)",
  "479": "Arkansas (Fort Smith/Fayetteville)",
  "480": "Arizona (Mesa/Scottsdale)",
  "484": "Pennsylvania (Allentown/Reading overlay)",
  "501": "Arkansas (Little Rock)",
  "502": "Kentucky (Louisville)",
  "503": "Oregon (Portland)",
  "504": "Louisiana (New Orleans)",
  "505": "New Mexico",
  "507": "Minnesota (Rochester/Mankato)",
  "508": "Massachusetts (Worcester/Southeast)",
  "509": "Washington (Spokane/Eastern)",
  "510": "California (Oakland/East Bay)",
  "512": "Texas (Austin)",
  "513": "Ohio (Cincinnati)",
  "515": "Iowa (Des Moines)",
  "516": "New York (Long Island Nassau)",
  "517": "Michigan (Lansing)",
  "518": "New York (Albany/Northeast)",
  "520": "Arizona (Tucson)",
  "530": "California (Sacramento North)",
  "531": "Nebraska (Omaha overlay)",
  "534": "Wisconsin (North overlay)",
  "539": "Oklahoma (Tulsa overlay)",
  "540": "Virginia (Roanoke/Western)",
  "541": "Oregon (Eugene/Bend)",
  "551": "New Jersey (Northeast overlay)",
  "559": "California (Fresno)",
  "561": "Florida (West Palm Beach)",
  "562": "California (Long Beach)",
  "563": "Iowa (Davenport/Dubuque)",
  "564": "Washington (West overlay)",
  "567": "Ohio (Toledo overlay)",
  "570": "Pennsylvania (Scranton/Wilkes-Barre)",
  "571": "Virginia (Northern overlay)",
  "573": "Missouri (Columbia/Jefferson City)",
  "574": "Indiana (South Bend)",
  "575": "New Mexico (Las Cruces)",
  "580": "Oklahoma (Lawton/Enid)",
  "585": "New York (Rochester)",
  "586": "Michigan (Macomb County)",
  "601": "Mississippi (Jackson)",
  "602": "Arizona (Phoenix)",
  "603": "New Hampshire",
  "605": "South Dakota",
  "606": "Kentucky (East)",
  "607": "New York (Binghamton/Elmira)",
  "608": "Wisconsin (Madison/Southwest)",
  "609": "New Jersey (Trenton/Atlantic City)",
  "610": "Pennsylvania (Allentown/Reading)",
  "612": "Minnesota (Minneapolis)",
  "614": "Ohio (Columbus)",
  "615": "Tennessee (Nashville)",
  "616": "Michigan (Grand Rapids)",
  "617": "Massachusetts (Boston)",
  "618": "Illinois (Southern)",
  "619": "California (San Diego)",
  "620": "Kansas (South)",
  "623": "Arizona (Phoenix West)",
  "626": "California (Pasadena/San Gabriel Valley)",
  "628": "California (San Francisco overlay)",
  "629": "Tennessee (Nashville overlay)",
  "630": "Illinois (Chicago West suburbs)",
  "631": "New York (Long Island Suffolk)",
  "636": "Missouri (St. Louis suburbs)",
  "641": "Iowa (Mason City)",
  "646": "New York (Manhattan overlay)",
  "650": "California (San Mateo/Palo Alto)",
  "651": "Minnesota (St. Paul)",
  "657": "California (Orange County overlay)",
  "660": "Missouri (Sedalia/North)",
  "661": "California (Bakersfield/Santa Clarita)",
  "662": "Mississippi (North)",
  "667": "Maryland (Baltimore overlay)",
  "669": "California (San Jose overlay)",
  "678": "Georgia (Atlanta overlay)",
  "680": "New York (Syracuse overlay)",
  "681": "West Virginia overlay",
  "682": "Texas (Fort Worth overlay)",
  "701": "North Dakota",
  "702": "Nevada (Las Vegas)",
  "703": "Virginia (Northern)",
  "704": "North Carolina (Charlotte)",
  "706": "Georgia (Augusta/Columbus)",
  "707": "California (Santa Rosa/Napa)",
  "708": "Illinois (Chicago South suburbs)",
  "712": "Iowa (Sioux City/Council Bluffs)",
  "713": "Texas (Houston)",
  "714": "California (Orange County)",
  "715": "Wisconsin (North)",
  "716": "New York (Buffalo)",
  "717": "Pennsylvania (Harrisburg/Lancaster)",
  "718": "New York (NYC outer boroughs)",
  "719": "Colorado (Colorado Springs)",
  "720": "Colorado (Denver overlay)",
  "724": "Pennsylvania (Pittsburgh suburbs)",
  "725": "Nevada (Las Vegas overlay)",
  "727": "Florida (St. Petersburg/Clearwater)",
  "731": "Tennessee (Jackson/West)",
  "732": "New Jersey (Central)",
  "734": "Michigan (Ann Arbor/Downriver)",
  "737": "Texas (Austin overlay)",
  "740": "Ohio (Newark/Lancaster)",
  "743": "North Carolina (Greensboro overlay)",
  "747": "California (San Fernando Valley overlay)",
  "754": "Florida (Broward overlay)",
  "757": "Virginia (Norfolk/Virginia Beach)",
  "760": "California (San Diego North/Inland)",
  "762": "Georgia (Augusta overlay)",
  "763": "Minnesota (Minneapolis NW suburbs)",
  "765": "Indiana (Muncie/Lafayette)",
  "769": "Mississippi (Jackson overlay)",
  "770": "Georgia (Atlanta suburbs)",
  "772": "Florida (Treasure Coast)",
  "773": "Illinois (Chicago)",
  "774": "Massachusetts (Worcester overlay)",
  "775": "Nevada (Reno)",
  "779": "Illinois (Rockford overlay)",
  "781": "Massachusetts (Boston suburbs)",
  "785": "Kansas (Topeka/Lawrence)",
  "786": "Florida (Miami overlay)",
  "801": "Utah (Salt Lake City)",
  "802": "Vermont",
  "803": "South Carolina (Columbia)",
  "804": "Virginia (Richmond)",
  "805": "California (Ventura/Santa Barbara)",
  "806": "Texas (Lubbock/Amarillo)",
  "808": "Hawaii",
  "810": "Michigan (Flint/Port Huron)",
  "812": "Indiana (Evansville/Bloomington)",
  "813": "Florida (Tampa)",
  "814": "Pennsylvania (Erie/State College)",
  "815": "Illinois (Rockford/Joliet)",
  "816": "Missouri (Kansas City)",
  "817": "Texas (Fort Worth)",
  "818": "California (San Fernando Valley)",
  "828": "North Carolina (Asheville)",
  "830": "Texas (Hill Country)",
  "831": "California (Monterey/Santa Cruz)",
  "832": "Texas (Houston overlay)",
  "843": "South Carolina (Charleston)",
  "845": "New York (Hudson Valley)",
  "847": "Illinois (Chicago North suburbs)",
  "848": "New Jersey (Central overlay)",
  "850": "Florida (Panhandle)",
  "854": "South Carolina (Charleston overlay)",
  "856": "New Jersey (Southwest/Camden)",
  "857": "Massachusetts (Boston overlay)",
  "858": "California (San Diego North)",
  "859": "Kentucky (Lexington/Northern)",
  "860": "Connecticut (Hartford/North)",
  "862": "New Jersey (Newark overlay)",
  "863": "Florida (Lakeland)",
  "864": "South Carolina (Greenville/Spartanburg)",
  "865": "Tennessee (Knoxville)",
  "870": "Arkansas (Jonesboro/Pine Bluff)",
  "872": "Illinois (Chicago overlay)",
  "878": "Pennsylvania (Pittsburgh overlay)",
  "901": "Tennessee (Memphis)",
  "903": "Texas (Tyler/Longview)",
  "904": "Florida (Jacksonville)",
  "906": "Michigan (Upper Peninsula)",
  "907": "Alaska",
  "908": "New Jersey (Elizabeth)",
  "909": "California (San Bernardino)",
  "910": "North Carolina (Fayetteville/Wilmington)",
  "912": "Georgia (Savannah)",
  "913": "Kansas (Kansas City KS)",
  "914": "New York (Westchester)",
  "915": "Texas (El Paso)",
  "916": "California (Sacramento)",
  "917": "New York (NYC overlay)",
  "918": "Oklahoma (Tulsa)",
  "919": "North Carolina (Raleigh/Durham)",
  "920": "Wisconsin (Green Bay/Appleton)",
  "925": "California (Concord/East Bay)",
  "928": "Arizona (Flagstaff/Yuma)",
  "929": "New York (NYC overlay)",
  "930": "Indiana (South overlay)",
  "931": "Tennessee (Clarksville/Columbia)",
  "934": "New York (Long Island overlay)",
  "936": "Texas (Conroe/Huntsville)",
  "937": "Ohio (Dayton)",
  "938": "Alabama (Huntsville overlay)",
  "940": "Texas (Wichita Falls/Denton)",
  "941": "Florida (Sarasota/Bradenton)",
  "947": "Michigan (Oakland overlay)",
  "949": "California (Orange County South)",
  "951": "California (Riverside)",
  "952": "Minnesota (Minneapolis SW suburbs)",
  "954": "Florida (Fort Lauderdale)",
  "956": "Texas (Laredo/Brownsville)",
  "959": "Connecticut (Hartford overlay)",
  "970": "Colorado (Fort Collins/Greeley)",
  "971": "Oregon (Portland overlay)",
  "972": "Texas (Dallas overlay)",
  "973": "New Jersey (Newark)",
  "978": "Massachusetts (Northeast)",
  "979": "Texas (Bryan/College Station)",
  "980": "North Carolina (Charlotte overlay)",
  "984": "North Carolina (Raleigh overlay)",
  "985": "Louisiana (Southeast)",
  "986": "Idaho overlay",
  "989": "Michigan (Saginaw/Midland)",
};

// Toll-free prefixes
const TOLL_FREE = new Set(["800", "833", "844", "855", "866", "877", "888"]);

export interface ParsedNumber {
  normalized: string; // 10 digits (US) or full international
  areaCode: string | undefined;
  region: string | undefined;
  lineTypeGuess: "mobile" | "landline" | "voip" | "toll_free" | "unknown";
  isValid: boolean;
  isUS: boolean;
}

// Parse a raw phone number input into normalized form + metadata.
export function parsePhoneNumber(raw: string): ParsedNumber {
  // Strip everything except digits and leading +
  const hasPlus = raw.trim().startsWith("+");
  const digits = raw.replace(/\D/g, "");

  let normalized = digits;
  let isUS = false;

  // Handle +1 / 1 prefix for US/Canada
  if (hasPlus && digits.startsWith("1") && digits.length === 11) {
    normalized = digits.slice(1);
    isUS = true;
  } else if (digits.length === 11 && digits.startsWith("1")) {
    normalized = digits.slice(1);
    isUS = true;
  } else if (digits.length === 10) {
    isUS = true;
  }

  if (!isUS || normalized.length !== 10) {
    return {
      normalized: digits,
      areaCode: undefined,
      region: undefined,
      lineTypeGuess: "unknown",
      isValid: false,
      isUS: false,
    };
  }

  const areaCode = normalized.slice(0, 3);
  const exchange = normalized.slice(3, 6);

  // Basic validation: area code can't start with 0 or 1; exchange can't start with 0 or 1
  const isValid =
    !areaCode.startsWith("0") &&
    !areaCode.startsWith("1") &&
    !exchange.startsWith("0") &&
    !exchange.startsWith("1");

  let lineTypeGuess: ParsedNumber["lineTypeGuess"] = "unknown";
  if (TOLL_FREE.has(areaCode)) {
    lineTypeGuess = "toll_free";
  }

  return {
    normalized,
    areaCode,
    region: AREA_CODE_REGIONS[areaCode],
    lineTypeGuess,
    isValid,
    isUS: true,
  };
}

// Look up a phone number and log it. Free for all signed-in users.
export const lookup = mutation({
  args: {
    rawNumber: v.string(),
    context: v.optional(v.string()), // texted_me | called_me | found_online | other
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const userId = user._id;

    const parsed = parsePhoneNumber(args.rawNumber);
    if (!parsed.isValid) {
      throw new Error(
        "Invalid phone number. Please enter a valid 10-digit US number."
      );
    }

    // Find phone-lookup brokers in the catalog that could search this number
    const phoneBrokers = await ctx.db
      .query("dataSources")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .filter((q) =>
        q.or(
          q.eq(q.field("category"), "Phone Lookup"),
          q.eq(q.field("category"), "People Search")
        )
      )
      .collect();

    // Check if this user already looked up this number
    const existing = await ctx.db
      .query("phoneLookups")
      .withIndex("by_user_and_number", (q) =>
        q.eq("userId", userId).eq("normalizedNumber", parsed.normalized)
      )
      .first();

    if (existing) {
      // Update the existing record with new context/notes
      await ctx.db.patch(existing._id, {
        context: args.context ?? existing.context,
        notes: args.notes ?? existing.notes,
        searchableBrokerIds: phoneBrokers.map((b) => b._id),
      });
      return {
        id: existing._id,
        ...parsed,
        isNew: false,
        brokersFound: phoneBrokers.length,
      };
    }

    const id = await ctx.db.insert("phoneLookups", {
      userId,
      normalizedNumber: parsed.normalized,
      rawInput: args.rawNumber,
      lineTypeGuess: parsed.lineTypeGuess,
      region: parsed.region,
      areaCode: parsed.areaCode,
      isValid: parsed.isValid,
      context: args.context,
      notes: args.notes,
      searchableBrokerIds: phoneBrokers.map((b) => b._id),
      createdAt: Date.now(),
    });

    return {
      id,
      ...parsed,
      isNew: true,
      brokersFound: phoneBrokers.length,
    };
  },
});

// Get the current user's lookup history, most recent first.
export const history = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    if (!user) return [];

    const lookups = await ctx.db
      .query("phoneLookups")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);

    // Join broker names for display
    const brokerIds = new Set(
      lookups.flatMap((l) => l.searchableBrokerIds ?? [])
    );
    const brokers = new Map();
    for (const bid of brokerIds) {
      const b = await ctx.db.get(bid);
      if (b) brokers.set(bid, { name: b.name, searchUrl: b.searchUrl });
    }

    return lookups.map((l) => ({
      ...l,
      brokers: (l.searchableBrokerIds ?? [])
        .map((bid) => brokers.get(bid))
        .filter(Boolean),
    }));
  },
});

// Get aggregate stats for the current user.
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    if (!user) return { total: 0, texted: 0, called: 0, flagged: 0 };

    const lookups = await ctx.db
      .query("phoneLookups")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return {
      total: lookups.length,
      texted: lookups.filter((l) => l.context === "texted_me").length,
      called: lookups.filter((l) => l.context === "called_me").length,
      flagged: lookups.filter((l) => l.notes && l.notes.length > 0).length,
    };
  },
});

// Delete a lookup record.
export const remove = mutation({
  args: { id: v.id("phoneLookups") },
  handler: async (ctx, { id }) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const lookup = await ctx.db.get(id);
    if (!lookup || lookup.userId !== user._id) {
      throw new Error("Not found or not yours");
    }

    await ctx.db.delete(id);
    return id;
  },
});
