import { useEffect, useState, useRef } from "react";
import "./styles/Loading.css";
import { useLoading } from "../context/LoadingProvider";

import Marquee from "react-fast-marquee";

const Loading = ({ percent }: { percent: number }) => {
  const { setIsLoading } = useLoading();
  const [loaded, setLoaded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [clicked, setClicked] = useState(false);
  const hasCompletedRef = useRef(false);

  // Transition to "Welcome" and open strictly when percent reaches 100%
  useEffect(() => {
    if (percent >= 100 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;

      // Allow user to clearly see 100%, then transition button to "Welcome"
      const welcomeTimer = setTimeout(() => {
        setLoaded(true);

        // Show "Welcome" briefly, then trigger the expansion animation
        const openTimer = setTimeout(() => {
          setIsLoaded(true);
        }, 800);

        return () => clearTimeout(openTimer);
      }, 400);

      return () => clearTimeout(welcomeTimer);
    }
  }, [percent]);

  useEffect(() => {
    if (!isLoaded) return;
    setClicked(true);
    let isCancelled = false;

    import("./utils/initialFX").then((module) => {
      if (isCancelled) return;
      const revealTimer = setTimeout(() => {
        if (module.initialFX) {
          module.initialFX();
        }
        setIsLoading(false);
      }, 900);

      return () => clearTimeout(revealTimer);
    });

    return () => {
      isCancelled = true;
    };
  }, [isLoaded, setIsLoading]);

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const { currentTarget: target } = e;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    target.style.setProperty("--mouse-x", `${x}px`);
    target.style.setProperty("--mouse-y", `${y}px`);
  }

  return (
    <>
      <div className="loading-header">
        <a href="/#" className="loader-title" data-cursor="disable">
          MokshyagnaYadav
        </a>

      </div>
      <div className="loading-screen">
        <div className="loading-marquee">
          <Marquee>
            <span>&nbsp; Engineering Student &nbsp;</span> <span>&nbsp; Engineering Student &nbsp;</span>
            <span>&nbsp; Engineering Student &nbsp;</span> <span>&nbsp; Engineering Student &nbsp;</span>
          </Marquee>
        </div>
        <div
          className={`loading-wrap ${clicked && "loading-clicked"}`}
          onMouseMove={(e) => handleMouseMove(e)}
        >
          <div className="loading-hover"></div>
          <div className={`loading-button ${loaded && "loading-complete"}`}>
            <div className="loading-container">
              <div className="loading-content">
                <div className="loading-content-in">
                  Loading <span>{percent}%</span>
                </div>
              </div>
              <div className="loading-box"></div>
            </div>
            <div className="loading-content2">
              <span>Welcome</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Loading;

export const setProgress = (setLoading: (value: number) => void) => {
  let percent: number = 0;
  let interval: ReturnType<typeof setInterval> | null = null;
  let isDone = false;

  interval = setInterval(() => {
    if (isDone) return;
    if (percent <= 50) {
      const rand = Math.round(Math.random() * 5);
      percent = Math.min(50, percent + rand);
      setLoading(percent);
    } else {
      if (interval) clearInterval(interval);
      interval = setInterval(() => {
        if (isDone) return;
        percent = Math.min(92, percent + Math.round(Math.random()));
        setLoading(percent);
        if (percent >= 92) {
          if (interval) clearInterval(interval);
          interval = null;
        }
      }, 1500);
    }
  }, 100);

  function cancel() {
    isDone = true;
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  function clear() {
    isDone = true;
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
    percent = 100;
    setLoading(100);
  }

  function loaded() {
    return new Promise<number>((resolve) => {
      if (interval) clearInterval(interval);
      if (percent >= 100) {
        setLoading(100);
        resolve(100);
        return;
      }
      interval = setInterval(() => {
        if (percent < 100) {
          percent++;
          setLoading(percent);
        } else {
          isDone = true;
          if (interval) clearInterval(interval);
          interval = null;
          percent = 100;
          setLoading(100);
          resolve(100);
        }
      }, 6);
    });
  }
  return { loaded, get percent() { return percent; }, clear, cancel };
};
