import express from 'express';
import multer from 'multer';
import fs from 'fs';
import speech from '@google-cloud/speech';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const upload = multer({ dest: 'uploads/' });

// Initialize Google Client
// It automatically looks for "GOOGLE_APPLICATION_CREDENTIALS" or you can pass it explicitly:
const client = new speech.SpeechClient({
  keyFilename: './google-key.json' // Path to your JSON key
});

app.post('/api/listen', upload.single('audio'), async (req, res) => {
  try {
    const filePath = req.file.path;
    
    // Read the file into memory
    const audioBytes = fs.readFileSync(filePath).toString('base64');

    // 1. CONFIGURE REQUEST (Crucial Step)
    const audio = {
      content: audioBytes,
    };
    
    const config = {
      encoding: 'LINEAR16', // Standard WAV format. Use 'MP3' if uploading .mp3
      sampleRateHertz: 16000, // Standard mic quality. Try 44100 or 48000 if it fails.
      languageCode: 'en-US',
    };

    const request = {
      audio: audio,
      config: config,
    };

    // 2. SEND TO GOOGLE
    console.log("🚀 Sending to Google...");
    const [response] = await client.recognize(request);
    
    // 3. PARSE RESPONSE
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');

    console.log(`📝 Transcript: ${transcription}`);

    // Clean up file
    fs.unlinkSync(filePath);

    res.json({ text: transcription });

  } catch (error) {
    console.error("❌ Google Error:", error);
    res.status(500).send({ error: error.message });
  }
});

app.listen(3000, () => console.log('🤖 Google Ears listening on 3000'));