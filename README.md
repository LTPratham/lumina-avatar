# LuminaAvatar (SaaS Widget)

**LuminaAvatar** is an embeddable, real-time, vector-animated voice companion widget designed for B2B SaaS onboarding, interactive product tours, and high-retention customer support. 

Instead of traditional, boring text chatbots, LuminaAvatar provides an expressive cartoon avatar that floats next to on-screen UI elements, talks naturally with human-like voice synthesis, listens to voice commands, and adapts to custom brand personas.

---

## 🚀 Business Model (Paid SaaS API)
1. **Developer SDK / Embeddable Widget:** Drop a `<script>` tag into any HTML/React page.
2. **Dynamic Dashboard:** Let customers upload their own FAQs, customize the avatar's appearance (color, clothes, logo), and assign conversational voice personas (e.g. Gen-Z guide, formal support agent, executive tutor).
3. **Usage-based API Pricing:** Bill companies based on the volume of conversation minutes or audio generation credits consumed.

---

## 📁 Repository Layout & Integration SDK
```
lumina-avatar/
├── README.md               # Product vision and integration documentation
├── package.json            # Widget build script and peer dependencies
├── src/
│   ├── sdk/
│   │   ├── index.ts        # Entry point for window.LuminaAvatar global object
│   │   └── loader.ts       # Asynchronous loading script for client websites
│   ├── components/
│   │   ├── AvatarCanvas.tsx# WebGL/HTML5 Rive animation canvas
│   │   └── SpeechBubble.tsx# Real-time subtitle overlays and micro-inputs
│   ├── audio/
│   │   ├── whisperSTT.ts   # Audio capture and speech-to-text pipeline
│   │   └── elevenLabsTTS.ts# Real-time streaming voice synthesis
│   └── dom/
│       └── elementAlign.ts # Computes coordinates of target elements to guide user flow
```

---

## 🎨 Recommended Tech Stack for SaaS Scale
* **Animation & Rendering:** Rive (WebGL vector animation runtime) to keep bundle sizes under 50KB.
* **Low-Latency Speech:** WebRTC/WebSockets streaming paired with OpenAI Realtime API or Cartesia TTS.
* **Widget Bundle Tool:** Rollup/Vite configured to compile the widget into a single, optimized `.js` bundle hosted on a global CDN.
* **Serverless Backend:** Next.js API routes or FastAPI deployed on AWS/Vercel for user dashboard analytics and context resolution.
