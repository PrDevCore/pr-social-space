import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Memory store for posts and activity logs
interface StoredPost {
  id: string;
  caption: string;
  platforms: string[];
  mediaUrls: string[];
  status: "published" | "scheduled" | "failed" | "draft";
  scheduledAt?: string;
  createdAt: string;
  apiResponse?: any;
  requestPayload?: any;
  error?: string;
}

interface ApiLog {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number;
  requestBody: any;
  responseBody: any;
  isSimulated: boolean;
}

const postsStore: StoredPost[] = [
  {
    id: "post_sample_1",
    caption: "🚀 Launching our new product update today! Check out the improved dashboard analytics and real-time social posting integration. #TechLaunch #Productivity",
    platforms: ["twitter", "linkedin", "facebook"],
    mediaUrls: ["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80"],
    status: "published",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    apiResponse: {
      success: true,
      id: "pfm_post_9921a",
      platforms_published: ["twitter", "linkedin", "facebook"],
      published_at: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  },
  {
    id: "post_sample_2",
    caption: "3 key strategies to increase audience engagement across social channels in 2026: 1. Consistent schedule 2. High quality visual assets 3. Interactive polls.",
    platforms: ["linkedin", "threads", "bluesky"],
    mediaUrls: [],
    status: "scheduled",
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    apiResponse: {
      success: true,
      id: "pfm_post_9921b",
      platforms_scheduled: ["linkedin", "threads", "bluesky"],
      scheduled_for: new Date(Date.now() + 86400000).toISOString()
    }
  }
];

const apiLogs: ApiLog[] = [];

// Helper function to call Post For Me API or simulate cleanly
async function executePostForMeRequest(
  endpoint: string,
  method: string,
  data?: any,
  providedKey?: string
) {
  const apiKey = providedKey || process.env.POST_FOR_ME_API_KEY || "";
  const baseUrl = process.env.POST_FOR_ME_API_BASE_URL || "https://api.postforme.dev/v1";
  const startTime = Date.now();

  const isRealApiKey = apiKey && apiKey !== "pfm_live_your_api_key_here" && !apiKey.startsWith("mock_");

  if (isRealApiKey) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "X-API-Key": apiKey
        },
        body: data ? JSON.stringify(data) : undefined
      });

      const resBody = await response.json().catch(() => ({ message: response.statusText }));
      const durationMs = Date.now() - startTime;

      const log: ApiLog = {
        id: "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
        timestamp: new Date().toISOString(),
        endpoint: `${baseUrl}${endpoint}`,
        method,
        statusCode: response.status,
        durationMs,
        requestBody: data,
        responseBody: resBody,
        isSimulated: false
      };
      apiLogs.unshift(log);

      return {
        status: response.status,
        ok: response.ok,
        data: resBody,
        log
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const log: ApiLog = {
        id: "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
        timestamp: new Date().toISOString(),
        endpoint: `${baseUrl}${endpoint}`,
        method,
        statusCode: 502,
        durationMs,
        requestBody: data,
        responseBody: { error: err.message || "Network Error calling Post For Me API" },
        isSimulated: false
      };
      apiLogs.unshift(log);

      return {
        status: 502,
        ok: false,
        error: err.message,
        data: { error: err.message },
        log
      };
    }
  } else {
    // Clean, realistic Post For Me API simulation
    await new Promise((r) => setTimeout(r, 600)); // Network latency sim
    const durationMs = Date.now() - startTime;
    const generatedPfmId = "pfm_" + Math.random().toString(36).substring(2, 11);

    let mockData: any = {};
    if (endpoint.includes("/posts/schedule") || (data && data.scheduledAt)) {
      mockData = {
        id: generatedPfmId,
        object: "post",
        status: "scheduled",
        caption: data?.caption,
        platforms: data?.platforms || [],
        media_urls: data?.mediaUrls || [],
        scheduled_at: data?.scheduledAt || new Date(Date.now() + 86400000).toISOString(),
        created_at: new Date().toISOString(),
        note: "Simulated Post For Me API response (Provide a valid POST_FOR_ME_API_KEY to hit live Post For Me endpoints)."
      };
    } else if (endpoint.includes("/posts")) {
      mockData = {
        id: generatedPfmId,
        object: "post",
        status: "published",
        caption: data?.caption,
        platforms: data?.platforms || [],
        media_urls: data?.mediaUrls || [],
        published_at: new Date().toISOString(),
        platform_post_ids: (data?.platforms || []).reduce((acc: any, p: string) => {
          acc[p] = `${p}_post_${Math.floor(Math.random() * 899999 + 100000)}`;
          return acc;
        }, {}),
        note: "Simulated Post For Me API response (Provide a valid POST_FOR_ME_API_KEY to hit live Post For Me endpoints)."
      };
    } else if (endpoint.includes("/accounts")) {
      mockData = {
        object: "account_list",
        accounts: [
          { platform: "twitter", handle: "@tech_insights", status: "connected", followerCount: 14200 },
          { platform: "linkedin", handle: "company/tech-insights", status: "connected", followerCount: 8900 },
          { platform: "facebook", handle: "TechInsightsOfficial", status: "connected", followerCount: 22100 },
          { platform: "instagram", handle: "@tech.insights.app", status: "connected", followerCount: 18500 },
          { platform: "tiktok", handle: "@techinsights_tok", status: "connected", followerCount: 31000 },
          { platform: "pinterest", handle: "techinsights_pin", status: "connected", followerCount: 4200 }
        ]
      };
    } else if (endpoint.includes("/verify")) {
      mockData = {
        valid: true,
        organization: "Demo Organization",
        environment: apiKey ? "live" : "sandbox",
        message: apiKey ? "Post For Me API Key verified successfully!" : "Post For Me API sandbox active (simulation mode)."
      };
    } else {
      mockData = {
        success: true,
        endpoint,
        timestamp: new Date().toISOString()
      };
    }

    const log: ApiLog = {
      id: "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      endpoint: `${baseUrl}${endpoint}`,
      method,
      statusCode: 200,
      durationMs,
      requestBody: data || {},
      responseBody: mockData,
      isSimulated: true
    };
    apiLogs.unshift(log);

    return {
      status: 200,
      ok: true,
      data: mockData,
      log
    };
  }
}

// API ROUTE: Verify / Test Connection
app.post("/api/post-for-me/verify", async (req, res) => {
  const { apiKey } = req.body;
  const result = await executePostForMeRequest("/verify", "POST", { ping: true }, apiKey);
  res.status(result.status).json(result);
});

// API ROUTE: Publish Now
app.post("/api/post-for-me/publish", async (req, res) => {
  const { caption, platforms, mediaUrls, userApiKey } = req.body;

  if (!caption || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
    return res.status(400).json({ error: "Caption and at least one social platform are required." });
  }

  const pfmPayload = {
    caption,
    platforms,
    media_urls: mediaUrls || [],
    options: {
      auto_shorten_links: true,
      notify_on_failure: true
    }
  };

  const result = await executePostForMeRequest("/posts", "POST", pfmPayload, userApiKey);

  const newPost: StoredPost = {
    id: result.data.id || "post_" + Date.now(),
    caption,
    platforms,
    mediaUrls: mediaUrls || [],
    status: result.ok ? "published" : "failed",
    createdAt: new Date().toISOString(),
    apiResponse: result.data,
    requestPayload: pfmPayload,
    error: result.ok ? undefined : (result.data?.error || "Publishing failed")
  };

  postsStore.unshift(newPost);

  res.status(result.status).json({
    post: newPost,
    apiResult: result
  });
});

// API ROUTE: Schedule Post
app.post("/api/post-for-me/schedule", async (req, res) => {
  const { caption, platforms, mediaUrls, scheduledAt, userApiKey } = req.body;

  if (!caption || !platforms || !Array.isArray(platforms) || platforms.length === 0 || !scheduledAt) {
    return res.status(400).json({ error: "Caption, platforms, and schedule date/time are required." });
  }

  const pfmPayload = {
    caption,
    platforms,
    media_urls: mediaUrls || [],
    scheduled_at: scheduledAt
  };

  const result = await executePostForMeRequest("/posts/schedule", "POST", pfmPayload, userApiKey);

  const newPost: StoredPost = {
    id: result.data.id || "post_sched_" + Date.now(),
    caption,
    platforms,
    mediaUrls: mediaUrls || [],
    status: result.ok ? "scheduled" : "failed",
    scheduledAt,
    createdAt: new Date().toISOString(),
    apiResponse: result.data,
    requestPayload: pfmPayload
  };

  postsStore.unshift(newPost);

  res.status(result.status).json({
    post: newPost,
    apiResult: result
  });
});

// API ROUTE: Save Draft
app.post("/api/post-for-me/drafts", async (req, res) => {
  const { caption, platforms, mediaUrls } = req.body;

  const newPost: StoredPost = {
    id: "draft_" + Date.now(),
    caption: caption || "Untitled Draft",
    platforms: platforms || [],
    mediaUrls: mediaUrls || [],
    status: "draft",
    createdAt: new Date().toISOString()
  };

  postsStore.unshift(newPost);
  res.json({ post: newPost });
});

// API ROUTE: Retry Post
app.post("/api/post-for-me/posts/:id/retry", async (req, res) => {
  const { id } = req.params;
  const { userApiKey } = req.body;
  const postIndex = postsStore.findIndex((p) => p.id === id);

  if (postIndex === -1) {
    return res.status(404).json({ error: "Post not found" });
  }

  const post = postsStore[postIndex];
  const pfmPayload = {
    caption: post.caption,
    platforms: post.platforms,
    media_urls: post.mediaUrls
  };

  const result = await executePostForMeRequest("/posts", "POST", pfmPayload, userApiKey);

  if (result.ok) {
    postsStore[postIndex].status = "published";
    postsStore[postIndex].apiResponse = result.data;
    postsStore[postIndex].error = undefined;
  }

  res.status(result.status).json({
    post: postsStore[postIndex],
    apiResult: result
  });
});

// API ROUTE: Delete / Cancel Post
app.delete("/api/post-for-me/posts/:id", async (req, res) => {
  const { id } = req.params;
  const { userApiKey } = req.body;

  const postIndex = postsStore.findIndex((p) => p.id === id);
  if (postIndex !== -1) {
    const post = postsStore[postIndex];
    if (post.status === "scheduled") {
      await executePostForMeRequest(`/posts/${id}`, "DELETE", undefined, userApiKey);
    }
    postsStore.splice(postIndex, 1);
  }

  res.json({ success: true, deletedId: id });
});

// API ROUTE: Get All Posts
app.get("/api/post-for-me/posts", (req, res) => {
  res.json({ posts: postsStore });
});

// API ROUTE: Get Connected Accounts
app.get("/api/post-for-me/accounts", async (req, res) => {
  const userApiKey = req.query.apiKey as string | undefined;
  const result = await executePostForMeRequest("/accounts", "GET", undefined, userApiKey);
  res.json(result.data);
});

// API ROUTE: Get API Logs
app.get("/api/post-for-me/logs", (req, res) => {
  res.json({ logs: apiLogs });
});

// API ROUTE: AI Post Content Generator using Gemini API
app.post("/api/post-for-me/ai-generate", async (req, res) => {
  const { prompt, platforms, tone } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required for AI generation" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({
      caption: `✨ [AI Generated]: ${prompt}\n\nKey takeaway: Consistency build momentum. Elevate your brand strategy across ${platforms.join(", ")}! 🚀 #SocialMedia #Growth`,
      hashtags: ["#SocialStrategy", "#Marketing", "#Growth"]
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const targetPlatforms = Array.isArray(platforms) && platforms.length > 0 ? platforms.join(", ") : "Twitter, LinkedIn, Instagram";
    const selectedTone = tone || "professional and engaging";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an expert social media copywriter. Write an engaging post based on the following instructions:
Topic/Prompt: "${prompt}"
Platforms: ${targetPlatforms}
Tone: ${selectedTone}

Requirements:
- Ensure post fits character count limits (especially Twitter 280 chars if Twitter is selected).
- Include 3 relevant hashtags.
- Include appropriate emojis.
- Provide ONLY the post content text directly, with no extra conversational filler.`
    });

    const caption = response.text || prompt;
    res.json({ caption });
  } catch (err: any) {
    res.json({
      caption: `✨ ${prompt}\n\nElevate your digital footprint today! 🚀 #Marketing #BrandBuilding`,
      errorNote: err.message
    });
  }
});

// Vite Middleware for Development / Static serving for Production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
