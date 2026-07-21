import "./styles/Career.css";
import { config } from "../config";
import { useEffect, useRef } from "react";

const getDisplayYear = (period: string) => {
  if (period.includes("Present")) return "NOW";
  if (period.includes(" - ")) {
    return period.split(" - ")[0];
  }
  return period;
};

const Career = () => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeline = timelineRef.current;
    const section = sectionRef.current;
    if (!timeline || !section) return;

    const handleScroll = () => {
      const rect = section.getBoundingClientRect();
      const windowH = window.innerHeight;

      // How far we've scrolled into the section (0 → 1)
      // Start: when section top hits viewport bottom
      // End:   when section bottom hits viewport top
      const total = rect.height + windowH;
      const scrolled = windowH - rect.top;
      const progress = Math.min(Math.max(scrolled / total, 0), 1);

      timeline.style.maxHeight = `${progress * 100}%`;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // run once on mount

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="career-section section-container" ref={sectionRef}>
      <div className="career-container">
        <h2>
          My career <span>&</span>
          <br /> experience
        </h2>
        <div className="career-info">
          <div className="career-timeline" ref={timelineRef}>
            <div className="career-dot"></div>
          </div>
          {config.experiences.map((exp, index) => (
            <div key={index} className="career-info-box">
              <div className="career-info-in">
                <div className="career-role">
                  <h4>{exp.position}</h4>
                  <h5>{exp.company}</h5>
                </div>
                <h3>{getDisplayYear(exp.period)}</h3>
              </div>
              <p>{exp.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Career;
