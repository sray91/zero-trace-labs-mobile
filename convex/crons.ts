import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Monday 15:00 UTC = 10am ET / 7am PT — morning push in US timezones.
crons.weekly(
  "weekly progress report push",
  { dayOfWeek: "monday", hourUTC: 15, minuteUTC: 0 },
  internal.pushNotifications.sendWeeklyReports
);

export default crons;
