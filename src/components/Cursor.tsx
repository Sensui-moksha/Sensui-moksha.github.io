import { useEffect, useRef } from "react";
import "./styles/Cursor.css";
import gsap from "gsap";

const Cursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Disable custom cursor on touch devices to save CPU/battery
    if (window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 768) {
      return;
    }

    const cursor = cursorRef.current;
    if (!cursor) return;

    let hover = false;
    let rafId: number;
    const mousePos = { x: 0, y: 0 };
    const cursorPos = { x: 0, y: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;
    };
    document.addEventListener("mousemove", handleMouseMove, { passive: true });

    function loop() {
      if (!hover) {
        const delay = 6;
        cursorPos.x += (mousePos.x - cursorPos.x) / delay;
        cursorPos.y += (mousePos.y - cursorPos.y) / delay;
        gsap.to(cursor, { x: cursorPos.x, y: cursorPos.y, duration: 0.1 });
      }
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);

    const cleanupFns: (() => void)[] = [];

    document.querySelectorAll("[data-cursor]").forEach((item) => {
      const element = item as HTMLElement;

      const handleMouseOver = (e: MouseEvent) => {
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();

        if (element.dataset.cursor === "icons") {
          cursor.classList.add("cursor-icons");
          gsap.to(cursor, { x: rect.left, y: rect.top, duration: 0.1 });
          cursor.style.setProperty("--cursorH", `${rect.height}px`);
          hover = true;
        }
        if (element.dataset.cursor === "disable") {
          cursor.classList.add("cursor-disable");
        }
      };

      const handleMouseOut = () => {
        cursor.classList.remove("cursor-disable", "cursor-icons");
        hover = false;
      };

      element.addEventListener("mouseover", handleMouseOver);
      element.addEventListener("mouseout", handleMouseOut);

      cleanupFns.push(() => {
        element.removeEventListener("mouseover", handleMouseOver);
        element.removeEventListener("mouseout", handleMouseOut);
      });
    });

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("mousemove", handleMouseMove);
      cleanupFns.forEach((fn) => fn());
    };
  }, []);

  return <div className="cursor-main" ref={cursorRef}></div>;
};

export default Cursor;
