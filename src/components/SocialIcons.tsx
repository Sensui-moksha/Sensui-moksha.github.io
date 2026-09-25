import {
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa6";
import "./styles/SocialIcons.css";
import { TbNotes } from "react-icons/tb";
import { MdKeyboardArrowUp, MdDownload, MdVisibility } from "react-icons/md";
import { useEffect, useRef, useState } from "react";
import HoverLinks from "./HoverLinks";
import { config } from "../config";
import { playButtonClick } from "../utils/audio";

const SocialIcons = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const social = document.getElementById("social") as HTMLElement;
    if (!social) return;

    const cleanupFns: (() => void)[] = [];

    social.querySelectorAll("span").forEach((item) => {
      const elem = item as HTMLElement;
      const link = elem.querySelector("a") as HTMLElement;
      if (!link) return;

      const rect = elem.getBoundingClientRect();
      let mouseX = rect.width / 2;
      let mouseY = rect.height / 2;
      let currentX = 0;
      let currentY = 0;
      let rafId: number;

      const updatePosition = () => {
        currentX += (mouseX - currentX) * 0.1;
        currentY += (mouseY - currentY) * 0.1;

        link.style.setProperty("--siLeft", `${currentX}px`);
        link.style.setProperty("--siTop", `${currentY}px`);

        rafId = requestAnimationFrame(updatePosition);
      };

      const onMouseMove = (e: MouseEvent) => {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (x < 40 && x > 10 && y < 40 && y > 5) {
          mouseX = x;
          mouseY = y;
        } else {
          mouseX = rect.width / 2;
          mouseY = rect.height / 2;
        }
      };

      document.addEventListener("mousemove", onMouseMove, { passive: true });
      rafId = requestAnimationFrame(updatePosition);

      cleanupFns.push(() => {
        cancelAnimationFrame(rafId);
        document.removeEventListener("mousemove", onMouseMove);
      });
    });

    return () => {
      cleanupFns.forEach((fn) => fn());
    };
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleScrollTop = () => {
    playButtonClick();
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div className="icons-section">
      <div className="social-icons" data-cursor="icons" id="social">
        <span>
          <a href={config.contact.github} target="_blank" rel="noopener noreferrer" onClick={playButtonClick}>
            <FaGithub />
          </a>
        </span>
        <span>
          <a href={config.contact.linkedin} target="_blank" rel="noopener noreferrer" onClick={playButtonClick}>
            <FaLinkedinIn />
          </a>
        </span>

        <span>
          <a href={config.contact.instagram} target="_blank" rel="noopener noreferrer" onClick={playButtonClick}>
            <FaInstagram />
          </a>
        </span>
      </div>

      {/* Resume button with popup */}
      <div className="resume-wrapper" ref={menuRef}>
        {menuOpen && (
          <div className="resume-menu" data-cursor="disable">
            <button
              className="resume-menu-item"
              onClick={() => {
                playButtonClick();
                setMenuOpen(false);
                window.dispatchEvent(new CustomEvent("open-resume"));
              }}
            >
              <MdVisibility /> Preview Resume
            </button>
            <a
              href="/resume/resume.pdf"
              download="Mokshyagna_Yadav_Resume.pdf"
              className="resume-menu-item"
              onClick={() => {
                playButtonClick();
                setMenuOpen(false);
              }}
            >
              <MdDownload /> Download PDF
            </a>
            <button
              className="resume-menu-item"
              onClick={handleScrollTop}
            >
              <MdKeyboardArrowUp /> Scroll to Top
            </button>
          </div>
        )}
        <div
          className="resume-button"
          role="button"
          tabIndex={0}
          onClick={() => {
            playButtonClick();
            setMenuOpen((prev) => !prev);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              playButtonClick();
              setMenuOpen((prev) => !prev);
            }
          }}
          data-cursor="disable"
        >
          <HoverLinks text="RESUME" />
          <span>
            <TbNotes />
          </span>
        </div>
      </div>
    </div>
  );
};

export default SocialIcons;
