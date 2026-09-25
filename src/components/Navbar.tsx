import { useEffect, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HoverLinks from "./HoverLinks";
import { gsap } from "gsap";
import Lenis from "lenis";
import "./styles/Navbar.css";
import { config } from "../config";
import { VscTerminal } from "react-icons/vsc";
import { HiSpeakerWave, HiSpeakerXMark } from "react-icons/hi2";
import { THEMES, applyTheme, getCurrentTheme, ThemeOption } from "../utils/theme";
import { isSoundEnabled, toggleSound, playClick, playThemeSound } from "../utils/audio";

gsap.registerPlugin(ScrollTrigger);
export let lenis: Lenis | null = null;

const Navbar = () => {
  const [soundActive, setSoundActive] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<ThemeOption>(THEMES[0]);

  useEffect(() => {
    setSoundActive(isSoundEnabled());
    setCurrentTheme(getCurrentTheme());

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<ThemeOption>;
      if (customEvent.detail) {
        setCurrentTheme(customEvent.detail);
      }
    };
    window.addEventListener("accent-theme-change", handleThemeChange);

    // Initialize Lenis smooth scroll
    lenis = new Lenis({
      duration: 1.7,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.7,
      touchMultiplier: 2,
      infinite: false,
    });

    // Start paused
    lenis.stop();

    // Synchronize Lenis scroll with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // Handle smooth scroll animation frame
    let rafId: number;
    function raf(time: number) {
      lenis?.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Handle navigation links
    const cleanupLinks: (() => void)[] = [];
    const links = document.querySelectorAll(".header ul a");
    links.forEach((elem) => {
      const element = elem as HTMLAnchorElement;
      const handleClick = (e: MouseEvent) => {
        if (window.innerWidth > 1024) {
          e.preventDefault();
          const targetElem = e.currentTarget as HTMLAnchorElement;
          const section = targetElem.getAttribute("data-href");
          if (section && lenis) {
            const target = document.querySelector(section) as HTMLElement;
            if (target) {
              lenis.scrollTo(target, {
                offset: 0,
                duration: 1.5,
              });
            }
          }
        }
      };
      element.addEventListener("click", handleClick);
      cleanupLinks.push(() => element.removeEventListener("click", handleClick));
    });

    // Handle resize
    const handleResize = () => {
      lenis?.resize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      cleanupLinks.forEach((fn) => fn());
      window.removeEventListener("accent-theme-change", handleThemeChange);
      window.removeEventListener("resize", handleResize);
      lenis?.destroy();
    };
  }, []);

  return (
    <>
      <div className="header">
        <div className="navbar-left">
          <a href="/#" className="navbar-title" data-cursor="disable">
            MY
          </a>
          <button
            className="navbar-terminal-btn"
            onClick={() => {
              playClick();
              window.dispatchEvent(new CustomEvent("open-terminal"));
            }}
            data-cursor="disable"
            title="Open Interactive Terminal (Cmd+K)"
          >
            <VscTerminal />
            <span className="navbar-terminal-text">Terminal</span>
            <span className="navbar-kbd">⌘K</span>
          </button>
        </div>

        <a
          href={`mailto:${config.contact.email}`}
          className="navbar-connect"
          data-cursor="disable"
        >
          {config.contact.email}
        </a>

        <div className="navbar-right">
          {/* Accent Color Switcher */}
          <div className="navbar-theme-picker" title="Change accent color">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                className={`theme-dot ${currentTheme.id === theme.id ? "active" : ""}`}
                style={{ backgroundColor: theme.hex }}
                onClick={() => {
                  applyTheme(theme.id);
                  setCurrentTheme(theme);
                  playThemeSound(theme.id);
                }}
                data-cursor="disable"
                aria-label={`Theme ${theme.name}`}
              />
            ))}
          </div>

          {/* Sound FX Toggle */}
          <button
            className="navbar-sound-btn"
            onClick={() => {
              const next = toggleSound();
              setSoundActive(next);
            }}
            data-cursor="disable"
            title={soundActive ? "Mute UI sounds" : "Enable UI sounds"}
          >
            {soundActive ? <HiSpeakerWave /> : <HiSpeakerXMark />}
          </button>

          {/* Nav Links */}
          <ul>
            <li>
              <a data-href="#about" href="#about">
                <HoverLinks text="ABOUT" />
              </a>
            </li>
            <li>
              <a data-href="#work" href="#work">
                <HoverLinks text="WORK" />
              </a>
            </li>
            <li>
              <a data-href="#organizations" href="#organizations">
                <HoverLinks text="ORGS" />
              </a>
            </li>
            <li>
              <a data-href="#contact" href="#contact">
                <HoverLinks text="CONTACT" />
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="landing-circle1"></div>
      <div className="landing-circle2"></div>
      <div className="nav-fade"></div>
    </>
  );
};

export default Navbar;
