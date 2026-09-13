import * as THREE from "three";
import { RGBELoader } from "three-stdlib";
import { gsap } from "gsap";
import { getCurrentTheme, ThemeOption } from "../../../utils/theme";

const setLighting = (scene: THREE.Scene) => {
  const currentTheme = getCurrentTheme();
  const initialColor = new THREE.Color(currentTheme.hex);

  // Left/Rear rim directional light
  const directionalLight = new THREE.DirectionalLight(initialColor, 0);
  directionalLight.intensity = 0;
  directionalLight.position.set(-0.47, -0.32, -1);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  scene.add(directionalLight);

  // Right/Rear rim directional light for balanced side illumination
  const rightRimLight = new THREE.DirectionalLight(initialColor, 0);
  rightRimLight.intensity = 0;
  rightRimLight.position.set(0.65, -0.25, -1);
  scene.add(rightRimLight);

  // Point light for screen glow
  const pointLight = new THREE.PointLight(initialColor, 0, 100, 3);
  pointLight.position.set(3, 12, 4);
  pointLight.castShadow = true;
  scene.add(pointLight);

  // Smoothly update 3D lights when user switches themes
  const handleThemeChange = (e: Event) => {
    const customEvent = e as CustomEvent<ThemeOption>;
    if (customEvent.detail?.hex) {
      const targetColor = new THREE.Color(customEvent.detail.hex);
      gsap.to(directionalLight.color, {
        r: targetColor.r,
        g: targetColor.g,
        b: targetColor.b,
        duration: 0.8,
        ease: "power2.out",
      });
      gsap.to(rightRimLight.color, {
        r: targetColor.r,
        g: targetColor.g,
        b: targetColor.b,
        duration: 0.8,
        ease: "power2.out",
      });
      gsap.to(pointLight.color, {
        r: targetColor.r,
        g: targetColor.g,
        b: targetColor.b,
        duration: 0.8,
        ease: "power2.out",
      });
    }
  };

  window.addEventListener("accent-theme-change", handleThemeChange);

  new RGBELoader()
    .setPath("/models/")
    .load("char_enviorment.hdr", function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
      scene.environmentIntensity = 0;
      scene.environmentRotation.set(5.76, 85.85, 1);
    });

  function setPointLight(screenLight: any) {
    if (screenLight.material.opacity > 0.9) {
      pointLight.intensity = screenLight.material.emissiveIntensity * 20;
    } else {
      pointLight.intensity = 0;
    }
  }

  const duration = 2;
  const ease = "power2.inOut";

  function turnOnLights() {
    gsap.to(scene, {
      environmentIntensity: 0.64,
      duration: duration,
      ease: ease,
    });
    gsap.to(directionalLight, {
      intensity: 1,
      duration: duration,
      ease: ease,
    });
    gsap.to(rightRimLight, {
      intensity: 0.85,
      duration: duration,
      ease: ease,
    });
    gsap.to(".character-rim", {
      y: "55%",
      opacity: 1,
      delay: 0.2,
      duration: 2,
    });
  }

  const cleanup = () => {
    window.removeEventListener("accent-theme-change", handleThemeChange);
  };

  return { setPointLight, turnOnLights, cleanup };
};

export default setLighting;
