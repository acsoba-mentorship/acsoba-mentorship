import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.hourly(
  "expire stale mentorship requests",
  { minuteUTC: 0 },
  internal.mentorRequests.expireStalePendingRequests
);

crons.daily(
  "generate due pulse surveys",
  { hourUTC: 16, minuteUTC: 0 }, //16.00 UTC, 00.00 SGT
  internal.pulseSurveys.generateDuePulseSurveys
);

export default crons;