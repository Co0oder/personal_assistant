import Groq from "groq-sdk";
import multer from "multer";
import { google } from "googleapis";
import fs from "fs";

// 1. Setup Config
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const upload = multer({ dest: "/tmp" }); // Use disk for reliability

// 2. Setup Google Calendar Auth
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
);
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});
const calendar = google.calendar({ version: "v3", auth: oauth2Client });

// Middleware Helper
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    // --- STEP 1: HEAR (Transcribe) ---
    await runMiddleware(req, res, upload.single("audio"));
    if (!req.file) return res.status(400).json({ error: "No audio provided" });

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-large-v3-turbo",
      response_format: "json",
    });

    const userText = transcription.text;
    console.log("User said:", userText);
    fs.unlinkSync(req.file.path); // Clean up temp file

    // --- STEP 2: THINK (Extract Intent) ---
    // We give the AI the current time so it can calculate dates
    const now = new Date();
    const systemPrompt = `
    You are a smart personal assistant.
    Current Date/Time: ${now.toISOString()} (${now.toLocaleDateString("en-US", { weekday: "long" })}).

    If the user's input is a command to schedule an event (e.g., "meeting tomorrow", "remind me to"),
    you must output a JSON object strictly matching this schema:
    {
      "is_event": true,
      "summary": "Short Event Title",
      "start": "ISO 8601 String (e.g. 2025-12-12T14:00:00)",
      "end": "ISO 8601 String (default to 1 hour after start if not specified)"
    }

    If the user is just chatting (e.g., "Hello", "What time is it?"), output JSON:
    {
      "is_event": false,
      "reply": "Your conversational reply here."
    }

    Do not output markdown blocks (like \`\`\`json). Output raw JSON only.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText },
      ],
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" }, // Force JSON mode
    });

    const aiResult = JSON.parse(chatCompletion.choices[0]?.message?.content);

    // --- STEP 3: ACT (Create Event or Reply) ---

    if (aiResult.is_event) {
      // 3A. Create Calendar Event
      console.log("📅 Scheduling Event:", aiResult.summary);

      const event = await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          summary: aiResult.summary,
          start: { dateTime: aiResult.start },
          end: { dateTime: aiResult.end },
        },
      });

      res.status(200).json({
        transcript: userText,
        reply: `I've scheduled "${aiResult.summary}" for ${new Date(aiResult.start).toLocaleString()}.`,
        action: "event_created",
        link: event.data.htmlLink,
      });
    } else {
      // 3B. Just Chat
      res.status(200).json({
        transcript: userText,
        reply: aiResult.reply,
        action: "chat",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
