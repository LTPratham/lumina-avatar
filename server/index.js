import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, file.fieldname + '-' + Date.now() + ext);
  }
});
const upload = multer({ storage });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI client (supports Groq automatically if key starts with gsk_)
const openaiApiKey = process.env.OPENAI_API_KEY;
const isOpenAiMock = !openaiApiKey || openaiApiKey.includes('your_openai_api_key');
const isGroq = openaiApiKey && openaiApiKey.startsWith('gsk_');
const openai = isOpenAiMock ? null : new OpenAI({
  apiKey: openaiApiKey,
  baseURL: isGroq ? 'https://api.groq.com/openai/v1' : undefined
});

// Initialize ElevenLabs config
const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
const isElevenLabsMock = !elevenLabsApiKey || elevenLabsApiKey.includes('your_elevenlabs_api_key');
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

console.log('--- LuminaAvatar Dev Server Config ---');
console.log('OpenAI/Groq API Key configured:', !isOpenAiMock);
console.log('Using Groq high-speed provider:', !!isGroq);
console.log('ElevenLabs API Key configured:', !isElevenLabsMock);
console.log('--------------------------------------');

// Ensure uploads folder exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
}

// API Endpoint: Speech-to-Text (Whisper proxy)
app.post('/api/stt', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const filePath = req.file.path;
    console.log('Received audio file for transcription:', req.file.originalname, 'Size:', req.file.size);

    if (isOpenAiMock) {
      // Mock mode
      console.log('[Mock Mode] Simulating Whisper STT transcription...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // simulate latency
      
      // Clean up uploaded file
      fs.unlinkSync(filePath);

      const mockTranscripts = [
        "Hello! Show me the onboarding tour please.",
        "How do I configure my brand settings?",
        "Can you help me setup the integration SDK?",
        "This looks amazing! What is the next step?"
      ];
      const randomTranscript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
      
      return res.json({ text: randomTranscript });
    }

    // Call OpenAI Whisper API (or Groq Whisper if isGroq is true)
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: isGroq ? 'whisper-large-v3' : 'whisper-1',
    });

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    console.log('Transcription result:', response.text);
    res.json({ text: response.text });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    // Cleanup if file exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Transcription failed', details: error.message });
  }
});

// API Endpoint: Text-to-Speech (ElevenLabs proxy)
app.get('/api/tts', async (req, res) => {
  const text = req.query.text;
  if (!text) {
    return res.status(400).json({ error: 'No text query provided' });
  }

  console.log('TTS request received for:', text);

  try {
    if (isElevenLabsMock) {
      console.log('[Mock Mode] Serving static mock TTS sound stream...');
      const beepPath = path.join(__dirname, '..', 'public', 'beep.mp3');
      if (fs.existsSync(beepPath)) {
        const fileBuffer = fs.readFileSync(beepPath);
        res.set({
          'Content-Type': 'audio/mpeg',
          'Content-Length': fileBuffer.length,
          'x-tts-mock': 'true',
          'Access-Control-Expose-Headers': 'x-tts-mock'
        });
        return res.send(fileBuffer);
      }
      return res.status(404).json({ error: 'Mock audio file not found' });
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'audio/mpeg',
        'xi-api-key': elevenLabsApiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ElevenLabs error: ${response.status} - ${errText}`);
    }

    res.set({
      'Content-Type': 'audio/mpeg',
    });

    // Pipe the response stream directly back to the client
    const reader = response.body.getReader();
    
    // Helper to pipe stream to express response
    const pump = async () => {
      const { done, value } = await reader.read();
      if (done) {
        res.end();
        return;
      }
      res.write(Buffer.from(value));
      await pump();
    };

    await pump();
  } catch (error) {
    console.error('Error generating speech:', error);
    res.status(500).json({ error: 'TTS failed', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`LuminaAvatar Dev Gateway listening on http://localhost:${PORT}`);
});
