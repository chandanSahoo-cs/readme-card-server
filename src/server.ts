import express from "express";
import "dotenv/config";

import {
  fallbackSVG,
  fetchedData,
  profileSVG,
  type UserProfile,
} from "./lib/svg";

const app = express();
const PORT = process.env.PORT || 3001;
const INTERVAL_TIME = 1000 * 60; // 1 minute

let currentSVG: string = fallbackSVG;
let currentProfileData: UserProfile | null = null;

/**
 * Updates cached profile data and SVG.
 */
async function refreshCard(): Promise<void> {
  try {
    const freshData = await fetchedData();
    if (!freshData || Object.keys(freshData).length === 0) {
      currentSVG = fallbackSVG;
      currentProfileData = null;
      return;
    }

    if (JSON.stringify(freshData) !== JSON.stringify(currentProfileData)) {
      currentProfileData = freshData;
      // If profileSVG can accept data, pass freshData: await profileSVG(freshData)
      currentSVG = await profileSVG();
      console.log(`[${new Date().toISOString()}] Profile SVG updated.`);
    }
  } catch (error) {
    console.error("Error refreshing profile card:", error);
  }
}

// Routes
app.get("/card", (_req, res) => {
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader(
    "Cache-Control",
    "public, max-age=3600, stale-while-revalidate=60"
  );
  res.send(currentSVG || fallbackSVG);
});

app.get(["/", "/health"], (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// Bootstrap & Start Server
(async () => {
  console.log(`[${new Date().toISOString()}] Loading initial profile card...`);
  await refreshCard();

  const intervalId = setInterval(refreshCard, INTERVAL_TIME);

  const server = app.listen(PORT, () => {
    console.log(`Readme card server running at http://localhost:${PORT}`);
  });
})();
