import "./styles/Work.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useState } from "react";
import { MdArrowOutward } from "react-icons/md";
import { FaStar, FaCodeBranch } from "react-icons/fa6";
import { config } from "../config";

gsap.registerPlugin(ScrollTrigger);

interface GithubApiRepo {
  id: number;
  name: string;
  description: string | null;
  language: string | null;
  html_url: string;
  stargazers_count?: number;
  forks_count?: number;
}

export interface ProjectItem {
  id: number | string;
  title: string;
  description: string;
  technologies: string;
  url: string;
  stars?: number;
  forks?: number;
  category?: string;
}

const formatTitle = (name: string): string => {
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
};

const getRepoDescription = (name: string, desc?: string | null): string => {
  if (desc && desc.trim().length > 0) return desc;
  const lower = name.toLowerCase();
  if (lower.includes("aptos")) return "A decentralized application built on the Aptos blockchain exploring smart contracts.";
  if (lower.includes("weather")) return "Interactive weather web app displaying real-time forecasts using public APIs.";
  if (lower.includes("nft")) return "Blockchain achievement system using digital NFT badges for credentials.";
  if (lower.includes("attendance") || lower.includes("campus")) return "Full-stack institutional attendance management system with JWT auth and REST APIs.";
  return "Engineering and software development project exploring modern web technologies.";
};

const defaultProjects: ProjectItem[] = config.projects.map((proj) => ({
  id: proj.id,
  title: proj.title,
  description: proj.description,
  technologies: proj.technologies,
  url: `https://github.com/${config.social.github}`,
  category: proj.category,
}));

const Work = () => {
  const [projects, setProjects] = useState<ProjectItem[]>(defaultProjects);

  useEffect(() => {
    fetch("https://api.github.com/users/Sensui-moksha/repos?sort=updated&per_page=20")
      .then((res) => res.json())
      .then((data: GithubApiRepo[] | { message?: string }) => {
        if (Array.isArray(data)) {
          const filteredRepos = data.filter(
            (repo) => !repo.name.toLowerCase().startsWith("sensui-moksha")
          );
          if (filteredRepos.length > 0) {
            const mapped: ProjectItem[] = filteredRepos.slice(0, 6).map((repo) => ({
              id: repo.id,
              title: formatTitle(repo.name),
              description: getRepoDescription(repo.name, repo.description),
              technologies: repo.language || "TypeScript / Full-Stack",
              url: repo.html_url,
              stars: repo.stargazers_count,
              forks: repo.forks_count,
            }));
            setProjects(mapped);
          }
        }
      })
      .catch((err) => {
        console.warn("Using fallback projects due to GitHub API error:", err);
      });
  }, []);

  useEffect(() => {
    // Disable pinning on mobile to allow scrolling
    if (window.innerWidth <= 768) return;
    if (projects.length === 0) return;

    let translateX = 0;

    function setTranslateX() {
      const box = document.getElementsByClassName("work-box");
      if (box.length === 0) return;
      const rectLeft = document
        .querySelector(".work-container")!
        .getBoundingClientRect().left;
      const rect = box[0].getBoundingClientRect();
      const parentWidth = box[0].parentElement!.getBoundingClientRect().width;
      const padding = parseInt(window.getComputedStyle(box[0]).padding) / 2;
      translateX = rect.width * box.length - (rectLeft + parentWidth) + padding;
    }

    setTranslateX();

    const timeline = gsap.timeline({
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
  }, [projects]);

  return (
    <div className="work-section" id="work">
      <div className="work-container section-container">
        <h2>
          My <span>Work</span>
        </h2>
        <div className="work-flex">
          {projects.map((project, index) => (
            <div className="work-box" key={project.id}>
              <div className="work-info">
                <div className="work-title">
                  <h3>0{index + 1}</h3>

                  <div>
                    <h4>{project.title}</h4>
                    <p>{project.description}</p>
                  </div>
                </div>
                <div className="work-meta">
                  <div className="work-meta-left">
                    <h4>Tools and features</h4>
                    <p>{project.technologies}</p>
                  </div>
                  {((project.stars !== undefined && project.stars > 0) ||
                    (project.forks !== undefined && project.forks > 0)) && (
                    <div className="work-stats">
                      {project.stars !== undefined && project.stars > 0 && (
                        <span className="work-stat-badge" title={`${project.stars} stars`}>
                          <FaStar /> {project.stars}
                        </span>
                      )}
                      {project.forks !== undefined && project.forks > 0 && (
                        <span className="work-stat-badge" title={`${project.forks} forks`}>
                          <FaCodeBranch /> {project.forks}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <a
                href={project.url}
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
              <a
                href={`https://github.com/${config.social.github}`}
                target="_blank"
                rel="noreferrer"
                className="see-all-btn"
                data-cursor="disable"
              >
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
