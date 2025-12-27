import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { AppState, Metrics, NodeTarget } from '../types';

type Props = {
  nodeTargets: NodeTarget[];
  metrics: Metrics;
  appState: AppState;
};

const MIN_CAPACITY = 50000;
const BASE_SCENE_RADIUS = 720;
const THINKING_RADIUS = 1200;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const ThreeCanvasDynamic: React.FC<Props> = ({ nodeTargets, metrics, appState }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);

  const positionsRef = useRef<Float32Array | null>(null);
  const targetsRef = useRef<Float32Array | null>(null);
  const colorsRef = useRef<Float32Array | null>(null);
  const directionsRef = useRef<Float32Array | null>(null);
  const capacityRef = useRef<number>(0);
  const activeCountRef = useRef<number>(0);
  const needsColorUploadRef = useRef<boolean>(false);
  const animationIdRef = useRef<number | null>(null);

  const stateRef = useRef({ nodeTargets, metrics, appState });
  useEffect(() => {
    stateRef.current = { nodeTargets, metrics, appState };
  }, [nodeTargets, metrics, appState]);

  const ensureCapacity = (desired: number) => {
    if (capacityRef.current === desired && positionsRef.current && targetsRef.current && colorsRef.current) {
      return;
    }

    if (pointsRef.current) {
      sceneRef.current?.remove(pointsRef.current);
      pointsRef.current.geometry.dispose();
      (pointsRef.current.material as THREE.Material).dispose();
      pointsRef.current = null;
    }

    positionsRef.current = null;
    targetsRef.current = null;
    colorsRef.current = null;
    directionsRef.current = null;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(desired * 3);
    const targets = new Float32Array(desired * 3);
    const colors = new Float32Array(desired * 3);
    const directions = new Float32Array(desired * 3);

    const tmp = new THREE.Vector3();
    for (let i = 0; i < desired; i++) {
      tmp.setFromSphericalCoords(BASE_SCENE_RADIUS * Math.cbrt(Math.random()), Math.acos(2 * Math.random() - 1), Math.random() * Math.PI * 2);
      positions[i * 3 + 0] = tmp.x;
      positions[i * 3 + 1] = tmp.y;
      positions[i * 3 + 2] = tmp.z;

      targets[i * 3 + 0] = 0;
      targets[i * 3 + 1] = 0;
      targets[i * 3 + 2] = 0;

      colors[i * 3 + 0] = 0.55;
      colors[i * 3 + 1] = 0.85;
      colors[i * 3 + 2] = 1.0;

      tmp.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      directions[i * 3 + 0] = tmp.x;
      directions[i * 3 + 1] = tmp.y;
      directions[i * 3 + 2] = tmp.z;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.5,
      sizeAttenuation: true,
      vertexColors: true,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    sceneRef.current!.add(points);

    pointsRef.current = points;
    positionsRef.current = positions;
    targetsRef.current = targets;
    colorsRef.current = colors;
    directionsRef.current = directions;
    capacityRef.current = desired;
    needsColorUploadRef.current = true;
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x01020a, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    rendererRef.current = renderer;

    const setupCamera = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      const viewSize = 950;
      const aspect = width / Math.max(1, height);
      const camera = new THREE.OrthographicCamera(-viewSize * aspect, viewSize * aspect, viewSize, -viewSize, -4000, 4000);
      camera.position.set(0, 0, 2000);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;
    };

    setupCamera();
    ensureCapacity(MIN_CAPACITY);

    const handleResize = () => {
      if (!rendererRef.current || !cameraRef.current || !mountRef.current) return;
      rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      setupCamera();
    };

    window.addEventListener('resize', handleResize);

    let lastTime = performance.now();
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const rendererInstance = rendererRef.current;
      const cameraInstance = cameraRef.current;
      const sceneInstance = sceneRef.current;
      const positions = positionsRef.current;
      const targets = targetsRef.current;
      const colors = colorsRef.current;
      const directions = directionsRef.current;
      const points = pointsRef.current;

      if (!rendererInstance || !cameraInstance || !sceneInstance || !positions || !targets || !colors || !directions || !points) {
        return;
      }

      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      const { metrics: currentMetrics, appState: currentState } = stateRef.current;
      const arousal = clamp01(currentMetrics.arousal);
      const resonance = clamp01(currentMetrics.resonance);

      let ease = 0.03;
      if (currentState === 'forming') ease = 0.12;
      else if (currentState === 'visualizing') ease = 0.06;
      else if (currentState === 'thinking') ease = 0.08;
      else if (currentState === 'processing') ease = 0.1;

      const capacity = capacityRef.current;
      const activeCount = activeCountRef.current;
      const jitter = arousal * 0.65;

      const posAttr = points.geometry.getAttribute('position') as THREE.BufferAttribute;
      const colorAttr = points.geometry.getAttribute('color') as THREE.BufferAttribute;

      const breathing = (Math.sin(now * 0.0012) * 0.5 + 0.5) * resonance * 60;
      const cycleSpeed = 2 + arousal * 4;

      for (let i = 0; i < capacity; i++) {
        const baseIndex = i * 3;

        let targetX = targets[baseIndex];
        let targetY = targets[baseIndex + 1];
        let targetZ = targets[baseIndex + 2];

        if (currentState === 'thinking') {
          const radius = ((Math.sin(now * 0.0015 * cycleSpeed) + 1) * 0.5) * THINKING_RADIUS;
          targetX = directions[baseIndex] * radius;
          targetY = directions[baseIndex + 1] * radius;
          targetZ = directions[baseIndex + 2] * radius;
        } else if (currentState === 'processing') {
          targetX = directions[baseIndex] * 220;
          targetY = directions[baseIndex + 1] * 220;
          targetZ = directions[baseIndex + 2] * 220;

          colors[baseIndex] = 0.35;
          colors[baseIndex + 1] = 0.9;
          colors[baseIndex + 2] = 1.0;
          needsColorUploadRef.current = true;
        } else if (i >= activeCount) {
          targetX = targetY = targetZ = 0;
        }

        const px = positions[baseIndex];
        const py = positions[baseIndex + 1];
        const pz = positions[baseIndex + 2];

        positions[baseIndex] = px + (targetX - px) * ease + (Math.random() - 0.5) * jitter;
        positions[baseIndex + 1] = py + (targetY - py) * ease + (Math.random() - 0.5) * jitter;
        positions[baseIndex + 2] = pz + (targetZ - pz) * ease;

        if (currentState === 'visualizing') {
          positions[baseIndex + 2] += Math.sin((i * 0.001) + now * 0.0014) * (breathing * delta);
        }
      }

      posAttr.needsUpdate = true;
      if (needsColorUploadRef.current) {
        colorAttr.needsUpdate = true;
        needsColorUploadRef.current = false;
      }

      sceneInstance.rotation.y += 0.02 * delta;
      rendererInstance.render(sceneInstance, cameraInstance);
    };

    animate();

    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener('resize', handleResize);
      if (pointsRef.current) {
        pointsRef.current.geometry.dispose();
        (pointsRef.current.material as THREE.Material).dispose();
      }
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      pointsRef.current = null;
      positionsRef.current = null;
      targetsRef.current = null;
      colorsRef.current = null;
      directionsRef.current = null;
      capacityRef.current = 0;
    };
  }, []);

  useEffect(() => {
    const desired = Math.max(nodeTargets.length, MIN_CAPACITY);
    ensureCapacity(desired);

    const targets = targetsRef.current;
    const colors = colorsRef.current;
    if (!targets || !colors) return;

    const count = nodeTargets.length;
    activeCountRef.current = count;

    for (let i = 0; i < count; i++) {
      const node = nodeTargets[i];
      const idx = i * 3;
      targets[idx] = node.position.x;
      targets[idx + 1] = node.position.y;
      targets[idx + 2] = node.position.z;

      colors[idx] = node.color.r;
      colors[idx + 1] = node.color.g;
      colors[idx + 2] = node.color.b;
    }

    for (let i = count; i < capacityRef.current; i++) {
      const idx = i * 3;
      targets[idx] = 0;
      targets[idx + 1] = 0;
      targets[idx + 2] = 0;
    }

    needsColorUploadRef.current = true;
  }, [nodeTargets]);

  return <div ref={mountRef} className="absolute inset-0" />;
};

export default ThreeCanvasDynamic;
