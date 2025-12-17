import multer from "multer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { AssistantFacade } from "../dist/facades/AssistantFacade.js";
import { createServices } from "../dist/config/ServiceConfig.js";

// Load environment variables
dotenv.config();

// Setup file upload
const upload = multer({ dest: "/tmp" });

// Initialize assistant facade with all services
const assistant = new AssistantFacade(createServices());

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let filePath = null;

  try {
    // Handle file upload
    await runMiddleware(req, res, upload.single("audio"));

    if (!req.file) {
      return res.status(400).json({ error: "No audio provided" });
    }

    // Rename file to include original extension
    const originalExt = path.extname(req.file.originalname) || ".m4a";
    filePath = req.file.path + originalExt;
    fs.renameSync(req.file.path, filePath);

    console.log(`Processing: ${filePath}`);

    // Let the facade handle the entire workflow
    const result = await assistant.processAudioRequest(filePath);

    // Return the result
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error:", error);

    // Cleanup file if it still exists
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error("Failed to cleanup file:", cleanupError);
      }
    }

    return res.status(500).json({
      error: error.message,
      type: error.name || "Error",
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
