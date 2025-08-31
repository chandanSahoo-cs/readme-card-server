import express from "express";
import "dotenv/config";

import {
  fallbackSVG,
  fetchedData,
  profileSVG,
  type UserProfile,
} from "./lib/svg";

let currentSVG: string | null = null;
let currentProfileData: UserProfile | null = null;
const INTERVAL_TIME = 1000 * 60;

(async () => {
  console.log("Intial profile loaded at: ", new Date().toISOString());
  const fetchProfileData = await fetchedData();
  currentProfileData = fetchProfileData;
  if (!fetchProfileData || Object.keys(fetchProfileData).length === 0) {
    currentSVG = fallbackSVG;
  } else {
    currentSVG = await profileSVG();
  }
})();

setInterval(async () => {
  console.log("Running intervale at: ", Date.now());
  try {
    const fetchProfileData = await fetchedData();
    if (
      JSON.stringify(fetchProfileData) !== JSON.stringify(currentProfileData)
    ) {
      currentProfileData = fetchProfileData;
      currentSVG = await profileSVG();
      console.log("Profile refreshed at: ", new Date().toISOString());
    }
  } catch (error) {
    console.log("Error in background worker :: ", error);
  }
}, INTERVAL_TIME);

const app = express();

app.get("/card", async (_req, res) => {
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader(
    "Cache-Control",
    "public, max-age = 3600, stale-while-revalidate=60"
  );
  res.send(currentSVG);
});

app.get("/health", async (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Readme card server is running at http://localhost:${PORT}`);
});
