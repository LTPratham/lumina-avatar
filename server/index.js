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
    const domContextStr = req.body.domContext || '[]';
    console.log('Received audio file for transcription:', req.file.originalname, 'Size:', req.file.size, 'Context size:', domContextStr.length);

    let domContext = [];
    try {
      domContext = JSON.parse(domContextStr);
    } catch (e) {
      console.warn('Failed to parse DOM context in /api/stt:', e);
    }

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
      const mockResponses = {
        "Hello! Show me the onboarding tour please.": "Welcome! I would love to guide you. Just click the blue start button in the middle to begin our walkthrough.",
        "How do I configure my brand settings?": "You can customize my appearance, voice, and FAQs in the settings page of your Lumina dashboard.",
        "Can you help me setup the integration SDK?": "Absolutely! Copy the script snippet from our docs and paste it into the body of your HTML file.",
        "This looks amazing! What is the next step?": "Thank you! Next, let's explore how to configure custom conversational personas."
      };
      const randomResponse = mockResponses[randomTranscript];
      
      return res.json({ text: randomTranscript, response: randomResponse });
    }

    // Call OpenAI Whisper API (or Groq Whisper if isGroq is true)
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: isGroq ? 'whisper-large-v3' : 'whisper-1',
    });

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    console.log('Transcription result:', response.text);

    // Call chat completion for intelligent response with DOM context
    let aiResponse = "";
    let commands = [];
    try {
      const model = isGroq ? 'llama-3.1-8b-instant' : 'gpt-3.5-turbo';
      console.log(`Generating AI response using model: ${model}...`);
      
      const systemPrompt = `You are LuminaAvatar, an interactive voice guide for SaaS onboarding.
You are embedded in a webpage and have direct access to its DOM structure.
The user is speaking to you. You can respond directly AND trigger actions on the webpage.

Here is the current state of the page (simplified DOM elements list):
${JSON.stringify(domContext, null, 2)}

You can execute the following actions:
1. 'align': Moves the avatar widget next to the specified element selector.
2. 'fill': Writes a string into an input field (requires 'value' property).
3. 'click': Clicks a button or link.
4. 'highlight': Briefly outlines an element to draw attention to it.

You must respond in JSON format with two keys:
- "speak": A warm, natural speech response (1 or 2 sentences max).
- "commands": An array of commands to execute. Each command must be an object with:
  - "action": "click", "fill", "align", or "highlight"
  - "selector": The exact CSS selector of the target element from the DOM context (e.g., "#name-field")
  - "value": (Only for "fill") The string value to write.

Examples:
- If user says: "write my name Prathamesh", you should respond with:
  {
    "speak": "Sure! I have written your name, Prathamesh, in the input field.",
    "commands": [
      { "action": "fill", "selector": "#name-field", "value": "Prathamesh" },
      { "action": "align", "selector": "#name-field" }
    ]
  }
- If user says: "Where is the terms?", you can respond with:
  {
    "speak": "Here are the terms and conditions on the page. It details that we guarantee 99.9% uptime.",
    "commands": [
      { "action": "align", "selector": "#terms-box" },
      { "action": "highlight", "selector": "#terms-box" }
    ]
  }

Make sure to align to elements when interacting with them. Respond with valid JSON.`;

      const chatCompletion = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: response.text }
        ],
        model: model,
        response_format: { type: "json_object" },
        max_tokens: 250
      });

      const responseContent = chatCompletion.choices[0]?.message?.content || "{}";
      console.log('LLM Raw Output:', responseContent);
      
      let parsed = { speak: responseContent, commands: [] };
      try {
        parsed = JSON.parse(responseContent);
      } catch (parseErr) {
        console.warn('Failed to parse JSON response from LLM, attempting cleanup:', responseContent);
        let cleanText = responseContent.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
          parsed = JSON.parse(cleanText);
        } catch (e) {
          parsed = { speak: cleanText, commands: [] };
        }
      }
      aiResponse = parsed.speak || "";
      commands = parsed.commands || [];
    } catch (chatErr) {
      console.error('Error generating chat completion:', chatErr);
      aiResponse = `I heard you say: "${response.text}". I had trouble generating a reply, but my speech synthesis is working!`;
    }

    console.log('AI Response:', aiResponse);
    console.log('Commands:', commands);
    res.json({ text: response.text, response: aiResponse, commands: commands });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    // Cleanup if file exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Transcription failed', details: error.message });
  }
});

// API Endpoint: Text Chat Completion (with DOM context)
app.post('/api/chat', async (req, res) => {
  const { text, domContext } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'No text query provided' });
  }

  console.log('Chat completion request received. Text:', text, 'Context size:', domContext ? domContext.length : 0);

  try {
    let aiResponse = "";
    let commands = [];

    if (isOpenAiMock) {
      // Mock fallback
      aiResponse = "I can see the Onboarding form and Platform Terms on the screen. Tell me your name, and I will write it down for you!";
      return res.json({ response: aiResponse, commands: [] });
    }

    const model = isGroq ? 'llama-3.1-8b-instant' : 'gpt-3.5-turbo';
    
    const systemPrompt = `You are LuminaAvatar, an interactive voice guide for SaaS onboarding.
You are embedded in a webpage and have direct access to its DOM structure.
The user is asking you for help. You can respond directly AND trigger actions on the webpage.

Here is the current state of the page (simplified DOM elements list):
${JSON.stringify(domContext || [], null, 2)}

You can execute the following actions:
1. 'align': Moves the avatar widget next to the specified element selector.
2. 'fill': Writes a string into an input field (requires 'value' property).
3. 'click': Clicks a button or link.
4. 'highlight': Briefly outlines an element to draw attention to it.

You must respond in JSON format with two keys:
- "speak": A warm, natural speech response explaining the page elements and how you can assist (1 or 2 sentences max).
- "commands": An array of commands to execute. Each command must be an object with:
  - "action": "click", "fill", "align", or "highlight"
  - "selector": The exact CSS selector of the target element from the DOM context (e.g., "#name-field")
  - "value": (Only for "fill") The string value to write.

Examples:
- If user says: "read the screen", you should respond with:
  {
    "speak": "I can see a User Onboarding card with Name and Password fields, and a Platform Terms block with four lines. How should we proceed?",
    "commands": [
      { "action": "highlight", "selector": "#form-card" },
      { "action": "highlight", "selector": "#terms-card" }
    ]
  }

Respond with valid JSON.`;

    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      model: model,
      response_format: { type: "json_object" },
      max_tokens: 250
    });

    const responseContent = chatCompletion.choices[0]?.message?.content || "{}";
    console.log('Chat LLM Raw Output:', responseContent);
    
    let parsed = { speak: responseContent, commands: [] };
    try {
      parsed = JSON.parse(responseContent);
    } catch (parseErr) {
      console.warn('Failed to parse JSON response, attempting cleanup:', responseContent);
      let cleanText = responseContent.replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        parsed = JSON.parse(cleanText);
      } catch (e) {
        parsed = { speak: cleanText, commands: [] };
      }
    }
    
    aiResponse = parsed.speak || "";
    commands = parsed.commands || [];

    res.json({ response: aiResponse, commands: commands });
  } catch (error) {
    console.error('Error generating chat completion:', error);
    res.status(500).json({ error: 'Chat completion failed', details: error.message });
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
