// Vercel serverless function backed by Vercel KV.
// Set up: in your Vercel project -> Storage -> Create Database -> KV -> connect to this project.
// Vercel injects the KV_REST_API_URL / KV_REST_API_TOKEN env vars automatically.

import { kv } from "@vercel/kv";

const TOP_N = 10;

export default async function handler(req, res) {
  if (req.method === "GET") {
    const course = req.query.course;
    if (!course) return res.status(400).json({ error: "course is required" });
    try {
      const data = (await kv.get(`leaderboard:${course}`)) || [];
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: "Could not read leaderboard" });
    }
  }

  if (req.method === "POST") {
    const { course, name, score, total, percent } = req.body || {};
    if (!course || !name || score == null || total == null || percent == null) {
      return res.status(400).json({ error: "Missing fields" });
    }
    try {
      const key = `leaderboard:${course}`;
      const current = (await kv.get(key)) || [];
      const updated = [
        ...current,
        { name: String(name).slice(0, 24), score, total, percent, date: new Date().toISOString() },
      ]
        .sort((a, b) => b.percent - a.percent)
        .slice(0, TOP_N);
      await kv.set(key, updated);
      return res.status(200).json(updated);
    } catch (e) {
      return res.status(500).json({ error: "Could not save score" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end("Method Not Allowed");
}
