import "./styles/Work.css";
import WorkImage from "./WorkImage";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useState } from "react";
import { MdArrowOutward } from "react-icons/md";

gsap.registerPlugin(ScrollTrigger);

interface GithubRepo {
  id: number;
  name: string;
  description: string;
  language: string;
  html_url: string;
  owner: {
    avatar_url: string;
  };
}

const Work = () => {
  const [repos, setRepos] = useState<GithubRepo[]>([]);

  useEffect(() => {
    fetch("https://api.github.com/users/Sensui-moksha/repos?sort=updated&per_page=20")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const filteredRepos = data.filter(repo => !repo.name.toLowerCase().startsWith("sensui-moksha"));
          setRepos(filteredRepos.slice(0, 6));
        }
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    // Disable pinning on mobile to allow scrolling
    if (window.innerWidth <= 768) return;
    if (repos.length === 0) return;

    let translateX: number = 0;

    function setTranslateX() {
      const box = document.getElementsByClassName("work-box");
      if (box.length === 0) return;
      const rectLeft = document
        .querySelector(".work-container")!
        .getBoundingClientRect().left;
      const rect = box[0].getBoundingClientRect();
      const parentWidth = box[0].parentElement!.getBoundingClientRect().width;
      let padding: number =
        parseInt(window.getComputedStyle(box[0]).padding) / 2;
      translateX = rect.width * box.length - (rectLeft + parentWidth) + padding;
    }

    setTranslateX();

    let timeline = gsap.timeline({
      scrollTrigger: {
        trigger: ".work-section",
        start: "top top",
        end: `+=${translateX}`,
        scrub: 1,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        id: "work",
        invalidateOnRefresh: true,
      },
    });

    timeline.to(".work-flex", {
      x: -translateX,
      ease: "none",
    });

    // Refresh ScrollTrigger after layout settles
    ScrollTrigger.refresh();

    // Clean up
    return () => {
      timeline.kill();
      ScrollTrigger.getById("work")?.kill();
    };
  }, [repos]);

  return (
    <div className="work-section" id="work">
      <div className="work-container section-container">
        <h2>
          My <span>Work</span>
        </h2>
        <div className="work-flex">
          {repos.map((repo, index) => (
            <div className="work-box" key={repo.id}>
              <div className="work-info">
                <div className="work-title">
                  <h3>0{index + 1}</h3>

                  <div>
                    <h4>{repo.name}</h4>
                    <p>{repo.description || "GitHub Repository"}</p>
                  </div>
                </div>
                <h4>Tools and features</h4>
                <p>{repo.language || "Multiple"}</p>
              </div>
              <a
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
                className="work-view-link"
                data-cursor="disable"
              >
                View Project <MdArrowOutward />
              </a>
              <div className="work-spacer"></div>
            </div>
          ))}
          {/* See All Works Button */}
          <div className="work-box work-box-cta">
            <div className="see-all-works">
              <h3>Want to see more?</h3>
              <p>Explore all of my projects and creations</p>
              <a href="https://github.com/Sensui-moksha" target="_blank" rel="noreferrer" className="see-all-btn" data-cursor="disable">
                Explore →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Work;
