import { useEffect, useRef } from "react";
import * as THREE from "three";
import setCharacter from "./utils/character";
import setLighting from "./utils/lighting";
import { useLoading } from "../../context/LoadingProvider";
import handleResize from "./utils/resizeUtils";
import {
  handleMouseMove,
  handleTouchEnd,
  handleHeadRotation,
  handleTouchMove,
} from "./utils/mouseUtils";
import setAnimations from "./utils/animationUtils";
import { setProgress } from "../Loading";

const Scene = () => {
  const canvasDiv = useRef<HTMLDivElement | null>(null);
  const hoverDivRef = useRef<HTMLDivElement>(null);
  const { setLoading } = useLoading();

  useEffect(() => {
    if (canvasDiv.current) {
      let isCancelled = false;
      const rect = canvasDiv.current.getBoundingClientRect();
      const container = { width: rect.width, height: rect.height };
      const aspect = container.width / container.height;
      const scene = new THREE.Scene();

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: window.devicePixelRatio < 2,
        powerPreference: "high-performance",
      });
      renderer.setSize(container.width, container.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;

      // Remove any lingering canvas elements before appending
      const existingCanvases = canvasDiv.current.querySelectorAll("canvas");
      existingCanvases.forEach((c) => c.remove());
      canvasDiv.current.appendChild(renderer.domElement);

      const camera = new THREE.PerspectiveCamera(14.5, aspect, 0.1, 1000);
      camera.position.z = 10;
      camera.position.set(0, 13.1, 24.7);
      camera.zoom = 1.1;
      camera.updateProjectionMatrix();

      let headBone: THREE.Object3D | null = null;
      let screenLight: any | null = null;
      let mixer: THREE.AnimationMixer;

      const clock = new THREE.Clock();

      const light = setLighting(scene);
      const progress = setProgress((value) => setLoading(value));
      const { loadCharacter } = setCharacter(renderer, scene, camera);

      let introTimer: ReturnType<typeof setTimeout> | undefined;
      let handleWindowResize: (() => void) | undefined;

      loadCharacter().then((gltf) => {
        if (isCancelled || !gltf) {
          if (gltf) {
            scene.remove(gltf.scene);
          }
          return;
        }

        const animations = setAnimations(gltf);
        hoverDivRef.current && animations.hover(gltf, hoverDivRef.current);
        mixer = animations.mixer;
        const character = gltf.scene;

        // Ensure character is only added once
        if (!scene.children.includes(character)) {
          scene.add(character);
        }

        headBone = character.getObjectByName("spine006") || null;
        screenLight = character.getObjectByName("screenlight") || null;
        progress.loaded().then(() => {
          if (isCancelled) return;
          introTimer = setTimeout(() => {
            if (isCancelled) return;
            light.turnOnLights();
            animations.startIntro();
          }, 2500);
        });
        handleWindowResize = () =>
          handleResize(renderer, camera, canvasDiv, character);
        window.addEventListener("resize", handleWindowResize);
      });

      let mouse = { x: 0, y: 0 },
        interpolation = { x: 0.1, y: 0.2 };

      const onMouseMove = (event: MouseEvent) => {
        handleMouseMove(event, (x, y) => (mouse = { x, y }));
      };
      let debounce: ReturnType<typeof setTimeout> | undefined;
      const onTouchStart = (event: TouchEvent) => {
        const element = event.target as HTMLElement;
        debounce = setTimeout(() => {
          element?.addEventListener(
            "touchmove",
            (e: TouchEvent) => handleTouchMove(e, (x, y) => (mouse = { x, y })),
            { passive: true }
          );
        }, 200);
      };

      const onTouchEnd = () => {
        handleTouchEnd((x, y, interpolationX, interpolationY) => {
          mouse = { x, y };
          interpolation = { x: interpolationX, y: interpolationY };
        });
      };

      document.addEventListener("mousemove", onMouseMove, { passive: true });
      const landingDiv = document.getElementById("landingDiv");
      if (landingDiv) {
        landingDiv.addEventListener("touchstart", onTouchStart, { passive: true });
        landingDiv.addEventListener("touchend", onTouchEnd, { passive: true });
      }

      let animFrameId: number;
      const animate = () => {
        animFrameId = requestAnimationFrame(animate);
        if (headBone) {
          handleHeadRotation(
            headBone,
            mouse.x,
            mouse.y,
            interpolation.x,
            interpolation.y,
            THREE.MathUtils.lerp
          );
          light.setPointLight(screenLight);
        }
        const delta = clock.getDelta();
        if (mixer) {
          mixer.update(delta);
        }
        renderer.render(scene, camera);
      };
      animate();

      const containerEl = canvasDiv.current;

      return () => {
        isCancelled = true;
        progress.cancel();
        cancelAnimationFrame(animFrameId);
        light.cleanup();
        clearTimeout(debounce);
        clearTimeout(introTimer);
        scene.clear();
        renderer.dispose();
        if (handleWindowResize) {
          window.removeEventListener("resize", handleWindowResize);
        }
        if (containerEl && renderer.domElement && containerEl.contains(renderer.domElement)) {
          containerEl.removeChild(renderer.domElement);
        }
        document.removeEventListener("mousemove", onMouseMove);
        if (landingDiv) {
          landingDiv.removeEventListener("touchstart", onTouchStart);
          landingDiv.removeEventListener("touchend", onTouchEnd);
        }
      };
    }
  }, []);

  return (
    <>
      <div className="character-container">
        <div className="character-model" ref={canvasDiv}>
          <div className="character-rim"></div>
          <div className="character-hover" ref={hoverDivRef}></div>
        </div>
      </div>
    </>
  );
};

export default Scene;
