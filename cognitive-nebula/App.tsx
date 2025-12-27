import React, { useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import ThreeCanvas from './components/ThreeCanvas';
import UIOverlay from './components/UIOverlay';
import { fetchAIResponse } from './services/ollamaService';
import { generateImageFromPrompt } from './services/imageGenerationService';
import { icaService } from './services/icaService'; // Import the ICA service
import type { Metrics, AppState, NodeTarget } from './types';

const INITIAL_METRICS: Metrics = {
    curiosity: 0.7,
    confusion: 0.3,
    coherence: 0.5,
    arousal: 0.4,
    valence: 0.6,
    dominance: 0.5,
    certainty: 0.5,
    resonance: 0.6,
};

const NUM_NODES = 8000;
const WORLD_WIDTH = 800;
const WORLD_HEIGHT = 800;

function processImageToTargets(base64Image: string): Promise<NodeTarget[]> {
    return new Promise((resolve, reject) => {
        // Check if it's an SVG data URL
        if (base64Image.startsWith('data:image/svg')) {
            // For SVG, we'll create a more direct approach
            resolve(generateTargetsFromSVGData(base64Image));
            return;
        }

        const image = new Image();

        image.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const aspectRatio = image.width / image.height;
                let drawWidth = WORLD_WIDTH;
                let drawHeight = WORLD_HEIGHT;

                if (aspectRatio > 1) {
                    drawHeight = WORLD_WIDTH / aspectRatio;
                } else {
                    drawWidth = WORLD_HEIGHT * aspectRatio;
                }

                canvas.width = Math.min(image.width, 512);
                canvas.height = Math.min(image.height, 512);

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    console.warn('Could not get canvas context, using fallback method');
                    return resolve(generateFallbackTargets(drawWidth, drawHeight));
                }

                try {
                    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const { data, width: imgWidth, height: imgHeight } = imageData;
                    const targets: NodeTarget[] = [];

                    for (let i = 0; i < NUM_NODES; i++) {
                        // Sample multiple pixels per node for better representation
                        let totalR = 0, totalG = 0, totalB = 0, sampleCount = 0;

                        for (let s = 0; s < 3 && (i * 3 + s) < imgWidth * imgHeight; s++) {
                            const sampleIndex = (i * 3 + s) % (imgWidth * imgHeight);
                            const x = sampleIndex % imgWidth;
                            const y = Math.floor(sampleIndex / imgWidth);
                            const pixelIndex = (y * imgWidth + x) * 4;

                            if (pixelIndex + 2 < data.length) {
                                totalR += data[pixelIndex] / 255;
                                totalG += data[pixelIndex + 1] / 255;
                                totalB += data[pixelIndex + 2] / 255;
                                sampleCount++;
                            }
                        }

                        if (sampleCount > 0) {
                            const avgR = totalR / sampleCount;
                            const avgG = totalG / sampleCount;
                            const avgB = totalB / sampleCount;
                            const brightness = (avgR + avgG + avgB) / 3;

                            // Create spiral pattern for better distribution
                            const t = (i / NUM_NODES) * 4 * Math.PI;
                            const radius = Math.sqrt(i / NUM_NODES) * Math.min(drawWidth, drawHeight) / 2;

                            const worldX = Math.cos(t) * radius;
                            const worldY = Math.sin(t) * radius;
                            const worldZ = (brightness - 0.5) * 150;

                            targets.push({
                                position: new THREE.Vector3(worldX, worldY, worldZ),
                                color: new THREE.Color(avgR, avgG, avgB),
                            });
                        }
                    }

                    if (targets.length > 0) {
                        resolve(targets);
                    } else {
                        resolve(generateFallbackTargets(drawWidth, drawHeight));
                    }
                } catch (drawError) {
                    console.warn('Error drawing image to canvas, using fallback:', drawError);
                    resolve(generateFallbackTargets(drawWidth, drawHeight));
                }
            } catch (error) {
                console.warn('Error processing image, using fallback:', error);
                resolve(generateFallbackTargets(WORLD_WIDTH, WORLD_HEIGHT));
            }
        };

        image.onerror = (error) => {
            console.warn('Image failed to load, using fallback method:', error);
            resolve(generateFallbackTargets(WORLD_WIDTH, WORLD_HEIGHT));
        };

        image.src = base64Image;
    });
}

// Generate targets directly from SVG data URL for more reliable processing
function generateTargetsFromSVGData(svgDataUrl: string): NodeTarget[] {
    const targets: NodeTarget[] = [];

    try {
        // Extract color information from SVG (look for fill colors, gradients, etc.)
        const colorMatches = svgDataUrl.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/g) || [];

        for (let i = 0; i < NUM_NODES; i++) {
            const t = (i / NUM_NODES) * 3 * Math.PI;
            const radius = Math.sqrt(i / NUM_NODES) * 200;

            const worldX = Math.cos(t) * radius;
            const worldY = Math.sin(t) * radius;
            const worldZ = Math.sin(i * 0.1) * 100;

            // Use colors from SVG or generate based on position
            let color: THREE.Color;
            if (colorMatches.length > 0) {
                const colorIndex = i % colorMatches.length;
                color = new THREE.Color(colorMatches[colorIndex]);
            } else {
                const hue = (i / NUM_NODES) * 360;
                color = new THREE.Color().setHSL(hue / 360, 0.8, 0.6);
            }

            targets.push({
                position: new THREE.Vector3(worldX, worldY, worldZ),
                color: color,
            });
        }
    } catch (error) {
        console.warn('Error parsing SVG data, using fallback:', error);
        return generateFallbackTargets(WORLD_WIDTH, WORLD_HEIGHT);
    }

    return targets;
}

// Fallback target generation for when image processing fails
function generateFallbackTargets(drawWidth: number, drawHeight: number): NodeTarget[] {
    const targets: NodeTarget[] = [];

    for (let i = 0; i < NUM_NODES; i++) {
        const t = (i / NUM_NODES) * 2 * Math.PI;
        const radius = Math.sqrt(i / NUM_NODES) * Math.min(drawWidth, drawHeight) / 2;

        const worldX = Math.cos(t) * radius;
        const worldY = Math.sin(t) * radius;
        const worldZ = (Math.sin(i * 0.1) * Math.cos(i * 0.05) - 0.5) * 100;

        // Generate vibrant colors
        const hue = (i / NUM_NODES) * 360 + Date.now() * 0.001;
        const color = new THREE.Color().setHSL((hue % 360) / 360, 0.8, 0.6);

        targets.push({
            position: new THREE.Vector3(worldX, worldY, worldZ),
            color: color,
        });
    }

    return targets;
}

function App() {
  const [metrics, setMetrics] = useState<Metrics>(INITIAL_METRICS);
  const [aiThought, setAiThought] = useState<string>('A silent nebula awaits a spark of inquiry.');
  const [appState, setAppState] = useState<AppState>('idle');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [targetData, setTargetData] = useState<NodeTarget[] | null>(null);
  const [icaResponse, setIcaResponse] = useState<any>(null); // State for ICA responses

  // Connect to ICA WebSocket on component mount
  useEffect(() => {
    icaService.connect();

    const unsubscribe = icaService.onMessage(data => {
      if (data.type === 'ica_output') {
        console.log('Received ICA output:', data.payload);
        setIcaResponse(data.payload);
      }
    });

    // Unsubscribe on component unmount
    return () => unsubscribe();
  }, []);

  const handleIcaSubmit = useCallback((prompt: string) => {
    setIcaResponse(null); // Clear previous response
    icaService.sendMessage('ica_input', prompt);
  }, []);

  const handlePromptSubmit = useCallback(async (prompt: string) => {
    setAppState('thinking');
    setAiThought('Generating visual concept...');
    setImageUrl(null);
    setTargetData(null);
    
    setMetrics(m => ({
        ...m,
        arousal: 0.95,
        curiosity: 0.95,
        coherence: 0.2,
    }));

    try {
      const [thought, generatedImageUrl] = await Promise.all([
        fetchAIResponse(prompt),
        generateImageFromPrompt(prompt),
      ]);

      setAiThought(thought);
      setImageUrl(generatedImageUrl);

      const newTargets = await processImageToTargets(generatedImageUrl);
      setTargetData(newTargets);
      setAppState('forming');
      
      setMetrics(m => ({
          ...m,
          curiosity: Math.random() * 0.5 + 0.4,
          coherence: 0.9,
          valence: (m.valence + (Math.random() - 0.5) * 0.4 + 1) % 1.0,
          certainty: 0.85,
          arousal: 0.3,
          resonance: Math.random() * 0.5 + 0.4,
          confusion: 0.1,
          dominance: Math.random() * 0.5 + 0.3,
      }));

    } catch (error) {
      console.error("Failed during AI generation process:", error);
      setAiThought("A creative spark fizzled. Please try again.");
      setAppState('idle');
      setMetrics(INITIAL_METRICS);
    }
  }, []);

  const isLoading = appState === 'thinking';

  return (
    <main className="w-full h-screen bg-black relative overflow-hidden font-sans">
      <ThreeCanvas 
        metrics={metrics} 
        appState={appState}
        targetData={targetData}
      />
      <UIOverlay 
        metrics={metrics}
        aiThought={aiThought}
        isLoading={isLoading}
        onPromptSubmit={handlePromptSubmit}
        imageUrl={imageUrl}
        // Pass new props for ICA
        icaResponse={icaResponse}
        onIcaSubmit={handleIcaSubmit}
      />
    </main>
  );
}

export default App;
