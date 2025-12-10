// api/process.js
import Groq from "groq-sdk";
import multer from 'multer';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const upload = multer({ storage: multer.memoryStorage() });

// Middleware helper
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // 1. Receive Audio
    await runMiddleware(req, res, upload.single('audio'));
    if (!req.file) return res.status(400).json({ error: 'No audio provided' });

    // 2. Transcribe (Ear)
    // Create a File object from the buffer
    const file = new File([req.file.buffer], "input.m4a", { type: "audio/m4a" });
    
    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: "whisper-large-v3",
      response_format: "json",
      language: "en",
    });

    const userText = transcription.text;
    console.log("User said:", userText);

    // 3. Think (Brain)
    // We send the transcript to Llama 3 to get an intelligent answer
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful, concise voice assistant. Keep answers short (under 2 sentences) because you are being spoken out loud."
        },
        {
          role: "user",
          content: userText
        }
      ],
      model: "llama-3.1-8b-instant", // Fast and smart
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || "I am not sure.";

    // 4. Return result
    res.status(200).json({ 
      transcript: userText, 
      reply: aiResponse 
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Vercel Config: Disable default body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};