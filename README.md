<div align="center">
  <h1>🌌 Cognitive Nebula</h1>
  <p><strong>A 3D visualization of AI's cognitive and emotional states</strong></p>
  <p>Watch a nebula of thoughts shift and change as generative AI processes and responds to your prompts</p>
</div>

---

## 📖 Overview

Cognitive Nebula is an interactive 3D visualization application that transforms AI thought processes into a beautiful particle-based nebula. As you interact with the AI through prompts, the visualization dynamically morphs to reflect the AI's cognitive and emotional states—curiosity, confusion, coherence, arousal, and more.

Built with React, Three.js, and TypeScript, this project creates an immersive experience that makes AI's "thinking" visible and tangible.

## ✨ Features

- **3D Particle Visualization**: 8,000+ particles forming a dynamic nebula that responds to AI states
- **Real-time Cognitive Metrics**: Visual representation of 8 different AI metrics:
  - Curiosity
  - Confusion
  - Coherence
  - Arousal
  - Valence
  - Dominance
  - Certainty
  - Resonance
- **AI-Powered Image Generation**: Generate visual concepts from text prompts
- **Interactive Canvas**: Explore the nebula in 3D space
- **WebSocket Integration**: Real-time communication with ICA (Interactive Cognitive Agent) service
- **Responsive UI**: Clean, modern interface with metrics overlay

## 🛠️ Technology Stack

- **Frontend Framework**: React 19.2.0
- **3D Graphics**: Three.js
- **Language**: TypeScript
- **Build Tool**: Vite
- **Testing**: Vitest with React Testing Library
- **Styling**: Modern CSS with responsive design

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 18 or higher recommended)
- **npm** or **yarn** package manager

## 🚀 Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kaleidoscopeAI/cognitive_nebula.git
   cd cognitive_nebula
   ```

2. Navigate to the application directory:
   ```bash
   cd cognitive-nebula
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up environment variables:
   - Create a `.env.local` file in the `cognitive-nebula` directory
   - Add your Gemini API key:
     ```
     GEMINI_API_KEY=your_api_key_here
     ```

### Running the Application

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Building for Production

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## 🧪 Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 📁 Project Structure

```
cognitive_nebula/
├── cognitive-nebula/          # Main application directory
│   ├── components/            # React components
│   │   ├── ThreeCanvas.tsx    # 3D visualization canvas
│   │   ├── UIOverlay.tsx      # UI overlay with metrics
│   │   └── ...
│   ├── services/              # Service layer
│   │   ├── ollamaService.ts   # AI response service
│   │   ├── imageGenerationService.ts
│   │   ├── icaService.ts      # WebSocket ICA integration
│   │   └── ...
│   ├── App.tsx                # Main application component
│   ├── types.ts               # TypeScript type definitions
│   ├── package.json           # Dependencies and scripts
│   ├── vite.config.ts         # Vite configuration
│   └── tsconfig.json          # TypeScript configuration
└── README.md                  # This file
```

## 💡 Usage

1. **Enter a Prompt**: Type a creative prompt in the input field (e.g., "a serene ocean at sunset", "abstract thoughts on consciousness")

2. **Watch the Nebula Transform**: The particle system will reorganize itself based on:
   - The AI-generated image from your prompt
   - The AI's cognitive and emotional states during processing

3. **Observe Metrics**: Monitor real-time changes in cognitive metrics displayed in the overlay

4. **Interact**: Explore the 3D space by rotating and zooming the canvas

## 🎯 How It Works

1. **Prompt Processing**: When you submit a prompt, the application sends it to the AI service
2. **Image Generation**: An image is generated based on your prompt
3. **Particle Mapping**: The image data is analyzed and mapped to 8,000 particle positions and colors
4. **Metrics Calculation**: Cognitive and emotional metrics are computed based on the AI's processing
5. **Visualization**: The nebula transforms to reflect the new state, with particles moving to their target positions

## 🔗 AI Studio Integration

View and deploy this app in AI Studio: [https://ai.studio/apps/drive/1nHSaCwo_Tk2flLFlTdn2ikDHRkY2JxY7](https://ai.studio/apps/drive/1nHSaCwo_Tk2flLFlTdn2ikDHRkY2JxY7)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with React and Three.js
- AI capabilities powered by Gemini API
- Inspired by the desire to visualize the invisible—the thought processes of artificial intelligence

---

<div align="center">
  <p>Made with ❤️ for exploring the beauty of AI cognition</p>
</div>
