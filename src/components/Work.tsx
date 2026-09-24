import "./styles/Work.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MdArrowOutward, MdClose } from "react-icons/md";
import { FaStar, FaCodeBranch, FaUsers, FaGithub } from "react-icons/fa6";
import { config } from "../config";
import { playButtonClick } from "../utils/audio";

gsap.registerPlugin(ScrollTrigger);

interface GithubApiRepo {
  id: number;
  name: string;
  description: string | null;
  language: string | null;
  html_url: string;
  stargazers_count?: number;
  forks_count?: number;
  contributors_url?: string;
}

export interface ContributorItem {
  login: string;
  avatarUrl: string;
  url: string;
  contributions?: number;
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
  contributors?: ContributorItem[];
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

const defaultContributors: ContributorItem[] = [
  {
    login: "Sensui-moksha",
    avatarUrl: "https://avatars.githubusercontent.com/u/114905086?v=4",
    url: "https://github.com/Sensui-moksha",
    contributions: 1,
  },
];

const defaultProjects: ProjectItem[] = config.projects.map((proj) => ({
  id: proj.id,
  title: proj.title,
  description: proj.description,
  technologies: proj.technologies,
  url: (proj as { url?: string }).url || `https://github.com/${config.social.github}`,
  category: proj.category,
  contributors: defaultContributors,
}));

const Work = () => {
  const [projects, setProjects] = useState<ProjectItem[]>(defaultProjects);
  const [selectedProjectForContributors, setSelectedProjectForContributors] =
    useState<ProjectItem | null>(null);

  useEffect(() => {
    fetch("https://api.github.com/users/Sensui-moksha/repos?sort=updated&per_page=20")
      .then((res) => res.json())
      .then(async (data: GithubApiRepo[] | { message?: string }) => {
        if (Array.isArray(data)) {
          const filteredRepos = data.filter(
            (repo) => !repo.name.toLowerCase().startsWith("sensui-moksha")
          );
          if (filteredRepos.length > 0) {
            const topRepos = filteredRepos.slice(0, 6);

            // Set initial mapped projects
            const initialMapped: ProjectItem[] = topRepos.map((repo) => ({
              id: repo.id,
              title: formatTitle(repo.name),
              description: getRepoDescription(repo.name, repo.description),
              technologies: repo.language || "TypeScript / Full-Stack",
              url: repo.html_url,
              stars: repo.stargazers_count,
              forks: repo.forks_count,
              contributors: [
                {
                  login: "Sensui-moksha",
                  avatarUrl: "https://avatars.githubusercontent.com/u/114905086?v=4",
                  url: "https://github.com/Sensui-moksha",
                  contributions: 1,
                },
              ],
            }));
            setProjects(initialMapped);

            // Fetch live contributors for each repo
            try {
              const withContributors = await Promise.all(
                topRepos.map(async (repo) => {
                  try {
                    const cRes = await fetch(
                      repo.contributors_url ||
                        `https://api.github.com/repos/Sensui-moksha/${repo.name}/contributors`
                    );
                    const cData = await cRes.json();
                    const contributors: ContributorItem[] =
                      Array.isArray(cData) && cData.length > 0
                        ? cData.map((c: any) => ({
                            login: c.login,
                            avatarUrl: c.avatar_url,
                            url: c.html_url,
                            contributions: c.contributions,
                          }))
                        : [
                            {
                              login: "Sensui-moksha",
                              avatarUrl:
                                "https://avatars.githubusercontent.com/u/114905086?v=4",
                              url: "https://github.com/Sensui-moksha",
                              contributions: 1,
                            },
                          ];

                    return {
                      id: repo.id,
                      title: formatTitle(repo.name),
                      description: getRepoDescription(repo.name, repo.description),
                      technologies: repo.language || "TypeScript / Full-Stack",
                      url: repo.html_url,
                      stars: repo.stargazers_count,
                      forks: repo.forks_count,
                      contributors,
                    };
                  } catch {
                    return null;
                  }
                })
              );

              const valid = withContributors.filter(Boolean) as ProjectItem[];
              if (valid.length > 0) {
                setProjects(valid);
              }
            } catch (cErr) {
              console.warn("Could not fetch all contributors:", cErr);
            }
          }
        }
      })
      .catch((err) => {
        console.warn("Using fallback projects due to GitHub API error:", err);
      });
  }, []);

  // Lock body scroll and handle Escape key for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedProjectForContributors(null);
      }
    };
    if (selectedProjectForContributors) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedProjectForContributors]);

  useEffect(() => {
    // Disable pinning on mobile to allow scrolling
    if (window.innerWidth <= 768) return;
    if (projects.length === 0) return;

    const setupScroll = () => {
      const workFlex = document.querySelector(".work-flex") as HTMLElement;
      const ctaBox = document.querySelector(".work-box-cta") as HTMLElement;
      if (!workFlex || !ctaBox) return null;

      // Reset transform before measuring to ensure accurate bounding rect
      gsap.set(workFlex, { x: 0 });

      const ctaRect = ctaBox.getBoundingClientRect();
      // Center the CTA box in the viewport
      const targetLeft = Math.max((window.innerWidth - ctaBox.offsetWidth) / 2, 80);
      const translateX = Math.max(ctaRect.left - targetLeft, 0);

      // Add a hold / pause distance so "Want to see more?" stays pinned and centered
      // before the next section arrives
      const holdDistance = Math.min(window.innerHeight * 0.6, 500);
      const totalScroll = translateX + holdDistance;

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: ".work-section",
          start: "top top",
          end: `+=${totalScroll}`,
          scrub: 1,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          id: "work",
          invalidateOnRefresh: true,
        },
      });

      // 1. Horizontal scroll until "Want to see more?" is centered
      timeline.to(workFlex, {
        x: -translateX,
        ease: "none",
        duration: translateX,
      });

      // 2. Hold pinned in place for holdDistance so user can view/click "Explore"
      timeline.to({}, {
        duration: holdDistance,
      });

      return timeline;
    };

    let timeline = setupScroll();

    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);

    const onResize = () => {
      timeline?.kill();
      ScrollTrigger.getById("work")?.kill();
      timeline = setupScroll();
      ScrollTrigger.refresh();
    };

    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
      timeline?.kill();
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
                    (project.forks !== undefined && project.forks > 0) ||
                    (project.contributors !== undefined && project.contributors.length > 0)) && (
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
                      {project.contributors !== undefined && project.contributors.length > 0 && (
                        <button
                          type="button"
                          className="work-stat-badge work-stat-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            playButtonClick();
                            setSelectedProjectForContributors(project);
                          }}
                          title={`View ${project.contributors.length} contributor${
                            project.contributors.length > 1 ? "s" : ""
                          }`}
                          data-cursor="disable"
                          aria-label={`View contributors for ${project.title}`}
                        >
                          <FaUsers className="work-stat-icon" /> {project.contributors.length}
                        </button>
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

      {/* Project Contributors Modal */}
      {selectedProjectForContributors &&
        createPortal(
          <div
            className="contributors-modal-backdrop"
            onClick={() => setSelectedProjectForContributors(null)}
          >
            <div
              className="contributors-modal-content"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="contributors-modal-title"
            >
              <div className="contributors-modal-header">
                <div className="contributors-modal-title-group">
                  <div className="contributors-icon-box">
                    <FaUsers />
                  </div>
                  <div>
                    <h3 id="contributors-modal-title" className="contributors-title">
                      Project Contributors
                    </h3>
                    <p className="contributors-subtitle">
                      {selectedProjectForContributors.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="contributors-close-btn"
                  onClick={() => setSelectedProjectForContributors(null)}
                  aria-label="Close modal"
                  data-cursor="disable"
                >
                  <MdClose />
                </button>
              </div>

              <div className="contributors-list">
                {selectedProjectForContributors.contributors?.map((contributor) => (
                  <a
                    key={contributor.login}
                    href={contributor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contributor-card"
                    data-cursor="disable"
                    onClick={playButtonClick}
                  >
                    <div className="contributor-avatar-wrap">
                      <img
                        src={contributor.avatarUrl}
                        alt={`${contributor.login} avatar`}
                        className="contributor-avatar"
                        loading="lazy"
                      />
                      <span className="contributor-github-badge">
                        <FaGithub />
                      </span>
                    </div>
                    <div className="contributor-info">
                      <span className="contributor-name">@{contributor.login}</span>
                      {contributor.contributions ? (
                        <span className="contributor-count">
                          {contributor.contributions}{" "}
                          {contributor.contributions === 1 ? "commit" : "commits"}
                        </span>
                      ) : (
                        <span className="contributor-count">Contributor</span>
                      )}
                    </div>
                    <div className="contributor-action">
                      <span>View Profile</span>
                      <MdArrowOutward />
                    </div>
                  </a>
                ))}
              </div>

              <div className="contributors-modal-footer">
                <a
                  href={`${selectedProjectForContributors.url}/graphs/contributors`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contributors-insights-link"
                  data-cursor="disable"
                  onClick={playButtonClick}
                >
                  <span>View Full Contributors Insights on GitHub</span>
                  <MdArrowOutward />
                </a>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default Work;
