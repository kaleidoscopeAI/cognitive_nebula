import React, { useRef, useEffect, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import type { Metrics, AppState, NodeTarget } from '../types';

interface ThreeCanvasProps {
  metrics: Metrics;
  appState: AppState;
  targetData: NodeTarget[] | null;
}

const ThreeCanvas: React.ForwardRefRenderFunction<unknown, ThreeCanvasProps> = ({ metrics, appState, targetData }, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  const stateRef = useRef({ metrics, appState, targetData });
  useEffect(() => {
    stateRef.current = { metrics, appState, targetData };
  }, [metrics, appState, targetData]);

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.001);

    const aspect = mount.clientWidth / mount.clientHeight;
    const frustumSize = 1000;
    const camera = new THREE.OrthographicCamera(frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, 1, 2000 );
    camera.position.z = 1000;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const geometry = new THREE.SphereGeometry(1.5, 8, 8);
    const material = new THREE.MeshBasicMaterial();
    const group = new THREE.Group();
    scene.add(group);

    const numNodes = 8000;
    const nodes: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>[] = [];
    const nodeDirections: THREE.Vector3[] = [];

    for (let i = 0; i < numNodes; i++) {
        const nodeMaterial = material.clone();
        nodeMaterial.color.setHSL(Math.random(), 1.0, 0.5);
        const node = new THREE.Mesh(geometry, nodeMaterial);
        node.position.set((Math.random() - 0.5) * 1500, (Math.random() - 0.5) * 1500, (Math.random() - 0.5) * 1500);
        nodes.push(node);
        group.add(node);
        nodeDirections.push(new THREE.Vector3().randomDirection());
    }
    
    let time = 0;
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.01;

      const { appState: currentAppState, metrics: currentMetrics, targetData: currentTargets } = stateRef.current;
      
      group.rotation.y += 0.0001 * currentMetrics.arousal;

      nodes.forEach((node, i) => {
        let targetPos: THREE.Vector3 | null = null;
        let targetColor: THREE.Color | null = null;
        let lerpFactor = 0.015;
        let pulse = 1.0;

        if (currentAppState === 'thinking') {
            // Tie speed to the arousal metric for dynamic feedback
            const cycleSpeed = 2 + currentMetrics.arousal * 4; // e.g., range from 2 to 6
            const maxScatterRadius = 1200;
            
            // Main scatter/converge cycle
            const currentRadius = ((Math.sin(time * cycleSpeed) + 1) / 2) * maxScatterRadius;
            targetPos = nodeDirections[i].clone().multiplyScalar(currentRadius);

            // Add a high-frequency secondary oscillation (jitter) to make the movement less uniform
            const jitterFrequency = 20;
            const jitterAmplitude = 40;
            targetPos.x += Math.sin(time * jitterFrequency + i * 0.3) * jitterAmplitude;
            targetPos.y += Math.cos(time * jitterFrequency + i * 0.6) * jitterAmplitude;
            targetPos.z += Math.sin(time * jitterFrequency + i * 0.9) * jitterAmplitude;

            lerpFactor = 0.05;
            
            // Enhance the pulsing effect for more visual energy
            pulse = 1.0 + Math.sin(time * 15 + i * 0.2) * 0.2;

        } else if (currentAppState === 'forming' && currentTargets && currentTargets[i]) {
            targetPos = currentTargets[i].position;
            targetColor = currentTargets[i].color;
            lerpFactor = 0.025 * currentMetrics.coherence;
        } else { // 'idle' state
            const idleX = 500 * Math.sin(time * 0.1 + i * 0.01);
            const idleY = 500 * Math.cos(time * 0.1 + i * 0.015);
            const idleZ = 500 * Math.sin(time * 0.1 + i * 0.02);
            targetPos = new THREE.Vector3(idleX, idleY, idleZ);
            lerpFactor = 0.005;
        }

        node.scale.set(pulse, pulse, pulse);

        if (targetPos) {
            node.position.lerp(targetPos, lerpFactor);
        }

        if (targetColor) {
            node.material.color.lerp(targetColor, lerpFactor);
        } else {
            const hue = (currentMetrics.valence * 0.6 + currentMetrics.curiosity * 0.4 + Math.sin(i * 0.1 + time) * 0.1) % 1.0;
            const saturation = 0.5 + currentMetrics.certainty * 0.5;
            const lightness = 0.4 + currentMetrics.resonance * 0.2;
            node.material.color.setHSL(hue, saturation, lightness);
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const aspect = mount.clientWidth / mount.clientHeight;
      camera.left = frustumSize * aspect / -2;
      camera.right = frustumSize * aspect / 2;
      camera.top = frustumSize / 2;
      camera.bottom = frustumSize / -2;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      nodes.forEach(node => node.material.dispose());
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full" />;
};

export default forwardRef(ThreeCanvas);