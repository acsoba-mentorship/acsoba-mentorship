import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.hourly(
  "expire stale mentorship requests",
  { minuteUTC: 0 },
  internal.mentorRequests.expireStalePendingRequests
);

export default crons;