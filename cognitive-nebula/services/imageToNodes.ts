import * as THREE from 'three';
import type { NodeTarget } from '../types';

type Options = {
  spread?: number;
  depthScale?: number;
  gamma?: number;
};

export async function imageToNodeTargets(
  imageDataUrl: string,
  numNodes: number,
  opts: Options = {},
): Promise<NodeTarget[]> {
  const spread = opts.spread ?? 700;
  const depthScale = opts.depthScale ?? 80;
  const gamma = opts.gamma ?? 2.2;

  const img = await loadImage(imageDataUrl);

  const { canvas, ctx } = makeCanvas(img.width, img.height);
  ctx.drawImage(img, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, img.width, img.height);

  const targets: NodeTarget[] = [];
  const cols = Math.ceil(Math.sqrt((numNodes * width) / height));
  const rows = Math.ceil(numNodes / cols);

  const stepX = width / cols;
  const stepY = height / rows;

  let taken = 0;
  for (let r = 0; r < rows; r++) {
    if (taken >= numNodes) break;
    for (let c = 0; c < cols; c++) {
      if (taken >= numNodes) break;

      const x = Math.min(Math.floor(c * stepX + stepX * 0.5), width - 1);
      const y = Math.min(Math.floor(r * stepY + stepY * 0.5), height - 1);

      const idx = (y * width + x) * 4;
      const R = data[idx] / 255;
      const G = data[idx + 1] / 255;
      const B = data[idx + 2] / 255;

      const lumLin = 0.2126 * Math.pow(R, gamma) + 0.7152 * Math.pow(G, gamma) + 0.0722 * Math.pow(B, gamma);
      const lum = Math.pow(lumLin, 1 / gamma);

      const nx = (x / (width - 1 || 1)) * 2 - 1;
      const ny = (y / (height - 1 || 1)) * 2 - 1;

      const pos = new THREE.Vector3(
        nx * spread,
        -ny * spread,
        (lum - 0.5) * 2 * depthScale,
      );

      const color = new THREE.Color(R, G, B);

      targets.push({ position: pos, color });
      taken++;
    }
  }

  while (targets.length < numNodes && taken > 0) {
    targets.push(targets[targets.length % taken]);
  }

  return targets;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img as HTMLImageElement);
    img.onerror = reject;
    img.src = src;
  });
}

function makeCanvas(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context not available');
  return { canvas, ctx };
}
