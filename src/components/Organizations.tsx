import { useEffect, useState, useRef } from "react";
import "./styles/Organizations.css";
import { config, OrganizationItem, OrgRepoItem, OrgMemberItem } from "../config";
import { playButtonClick } from "../utils/audio";
import { VscOrganization, VscRepo } from "react-icons/vsc";
import { FaGithub, FaLocationDot, FaCodeBranch, FaUsers, FaStar } from "react-icons/fa6";
import { MdArrowOutward } from "react-icons/md";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface GitHubApiOrg {
  login: string;
  id: number;
  avatar_url: string;
  description: string | null;
  url: string;
  repos_url: string;
}

interface GitHubOrgDetail {
  login: string;
  name: string | null;
  avatar_url: string;
  description: string | null;
  html_url: string;
  location: string | null;
  email: string | null;
  public_repos: number;
  followers: number;
}

interface GitHubMemberDetail {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
}

interface GitHubOrgRepo {
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  pushed_at?: string;
  updated_at?: string;
  created_at?: string;
}

const CACHE_KEY = "portfolio_github_orgs_cache_v3";

const formatRelativeDate = (dateStr?: string): string => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return "";
  }
};

const defaultOrgs: OrganizationItem[] = config.organizations || [];

const getInitialOrgs = (): OrganizationItem[] => {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore cache parse errors
    }
  }
  return defaultOrgs;
};

const Organizations = () => {
  const [orgs, setOrgs] = useState<OrganizationItem[]>(getInitialOrgs);
  const [isLiveSynced, setIsLiveSynced] = useState<boolean>(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchRealtimeData = async () => {
      try {
        const username = config.social.github || "Sensui-moksha";
        const response = await fetch(`https://api.github.com/users/${username}/orgs`);

        if (!response.ok) {
          console.info("GitHub API rate limited or unavailable, using synced static data.");
          return;
        }

        const orgList: GitHubApiOrg[] = await response.json();
        if (!Array.isArray(orgList) || orgList.length === 0) {
          return;
        }

        const enrichedOrgs: OrganizationItem[] = await Promise.all(
          orgList.map(async (rawOrg) => {
            const curatedMatch = defaultOrgs.find(
              (o) => o.login.toLowerCase() === rawOrg.login.toLowerCase()
            );

            let detail: GitHubOrgDetail | null = null;
            let fetchedMembers: OrgMemberItem[] = [];
            let fetchedRepos: OrgRepoItem[] = [];

            // 1. Fetch live organization profile details
            try {
              const detailRes = await fetch(`https://api.github.com/orgs/${rawOrg.login}`);
              if (detailRes.ok) {
                detail = await detailRes.json();
              }
            } catch (err) {
              console.warn(`Could not fetch details for ${rawOrg.login}:`, err);
            }

            // 2. Fetch live public team members
            try {
              const membersRes = await fetch(
                `https://api.github.com/orgs/${rawOrg.login}/public_members`
              );
              if (membersRes.ok) {
                const membersData: GitHubMemberDetail[] = await membersRes.json();
                if (Array.isArray(membersData) && membersData.length > 0) {
                  fetchedMembers = membersData.map((m) => ({
                    login: m.login,
                    avatarUrl: m.avatar_url,
                    url: m.html_url,
                    role:
                      m.login.toLowerCase() === username.toLowerCase()
                        ? "Core Member (You)"
                        : "Team Member",
                  }));
                }
              }
            } catch (err) {
              console.warn(`Could not fetch members for ${rawOrg.login}:`, err);
            }

            // Fallback members if members endpoint returned empty
            if (fetchedMembers.length === 0 && curatedMatch?.members) {
              fetchedMembers = curatedMatch.members;
            }

            // 3. Fetch live organization repositories (up to 100 projects)
            try {
              const reposRes = await fetch(
                `https://api.github.com/orgs/${rawOrg.login}/repos?per_page=100`
              );
              if (reposRes.ok) {
                const reposData: GitHubOrgRepo[] = await reposRes.json();
                if (Array.isArray(reposData) && reposData.length > 0) {
                  // Dynamic sorting:
                  // 1) Highest star count first (if repos have stars)
                  // 2) If stars are equal (e.g. 0 stars), newest / most recently pushed first!
                  reposData.sort((a, b) => {
                    const starsA = a.stargazers_count || 0;
                    const starsB = b.stargazers_count || 0;
                    if (starsB !== starsA) {
                      return starsB - starsA;
                    }
                    const timeA = new Date(
                      a.pushed_at || a.updated_at || a.created_at || 0
                    ).getTime();
                    const timeB = new Date(
                      b.pushed_at || b.updated_at || b.created_at || 0
                    ).getTime();
                    return timeB - timeA;
                  });

                  fetchedRepos = reposData.map((r) => {
                    const curatedRepo = curatedMatch?.repositories?.find(
                      (cr) => cr.name.toLowerCase() === r.name.toLowerCase()
                    );
                    return {
                      name: r.name,
                      description:
                        curatedRepo?.description ||
                        r.description ||
                        "Organization project repository",
                      url: r.html_url,
                      language:
                        curatedRepo?.language || r.language || "Open Source",
                      stars: r.stargazers_count || 0,
                      forks: r.forks_count || 0,
                      pushedAt: r.pushed_at,
                      updatedAt: r.updated_at,
                    };
                  });
                }
              }
            } catch (err) {
              console.warn(`Could not fetch repos for ${rawOrg.login}:`, err);
            }

            // Fallback repos if repos endpoint returned empty
            if (fetchedRepos.length === 0 && curatedMatch?.repositories) {
              fetchedRepos = curatedMatch.repositories;
            }

            const displayName =
              curatedMatch?.name || detail?.name || rawOrg.login;

            const description =
              curatedMatch?.description ||
              detail?.description ||
              rawOrg.description ||
              "Collaborative software engineering organization focused on building modern web applications, production services, and technical documentation.";

            return {
              id: rawOrg.id,
              name: displayName,
              login: rawOrg.login,
              role: curatedMatch?.role || "Core Contributor & Member",
              avatarUrl:
                detail?.avatar_url ||
                rawOrg.avatar_url ||
                curatedMatch?.avatarUrl ||
                "",
              url: detail?.html_url || `https://github.com/${rawOrg.login}`,
              description,
              location: detail?.location || curatedMatch?.location || "India",
              email: detail?.email || curatedMatch?.email || undefined,
              publicRepos:
                detail?.public_repos ??
                curatedMatch?.publicRepos ??
                fetchedRepos.length,
              membersCount:
                fetchedMembers.length > 0
                  ? fetchedMembers.length
                  : curatedMatch?.membersCount ?? 2,
              verified: true,
              members: fetchedMembers,
              repositories: fetchedRepos,
            };
          })
        );

        if (isMounted && enrichedOrgs.length > 0) {
          setOrgs(enrichedOrgs);
          setIsLiveSynced(true);
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(enrichedOrgs));
          } catch {
            // Ignore storage errors
          }
        }
      } catch (err) {
        console.warn("Using curated fallback organizations due to API error:", err);
      }
    };

    fetchRealtimeData();

    return () => {
      isMounted = false;
    };
  }, []);

  // GSAP ScrollTrigger entry animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".orgs-anim",
        {
          opacity: 0,
          y: 35,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );
    }, sectionRef);

    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 250);

    return () => {
      clearTimeout(timer);
      ctx.revert();
    };
  }, [orgs]);

  // 3D Holographic Tilt Handlers
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only apply tilt on devices that support hover
    if (window.matchMedia && window.matchMedia("(hover: none)").matches) return;

    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Pitch & Yaw tilt (subtle & premium 3D feeling)
    const rotateX = (0.5 - y) * 9;
    const rotateY = (x - 0.5) * 9;

    card.style.setProperty("--rx", `${rotateX.toFixed(2)}deg`);
    card.style.setProperty("--ry", `${rotateY.toFixed(2)}deg`);
    card.style.setProperty("--shine-x", `${(x * 100).toFixed(1)}%`);
    card.style.setProperty("--shine-y", `${(y * 100).toFixed(1)}%`);
    card.style.setProperty("--shine-opacity", "1");
    card.style.setProperty("--card-scale", "1.012");
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
    card.style.setProperty("--shine-opacity", "0");
    card.style.setProperty("--card-scale", "1");
  };

  if (orgs.length === 0) return null;

  return (
    <section className="orgs-section" id="organizations" ref={sectionRef}>
      <div id="orgs" style={{ position: "absolute", top: "-100px" }} />
      <div className="orgs-container section-container">
        {/* Header Badge */}
        <div className="orgs-badge-wrapper orgs-anim">
          <span className="orgs-badge">
            <VscOrganization className="orgs-badge-icon" />
            <span>Team Collaborations</span>
            <span className="orgs-badge-pulse" />
          </span>
        </div>

        {/* Heading */}
        <h2 className="orgs-heading orgs-anim">
          GitHub <span>Organizations</span>
        </h2>

        {/* Subheading */}
        <p className="orgs-subheading orgs-anim">
          Engineering collectives and organizations I actively contribute to on GitHub — shipping
          documentation platforms, open-source projects, and scalable web solutions.
        </p>

        {/* Organizations Cards */}
        <div className="orgs-grid">
          {orgs.map((org) => (
            <div
              key={org.id}
              className="org-card orgs-anim"
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
            >
              {/* Holographic light reflection layers */}
              <div className="org-card-holo" aria-hidden="true" />
              <div className="org-card-border-glow" aria-hidden="true" />

              {/* Card Header */}
              <div className="org-card-header">
                <div className="org-identity-group">
                  <div className="org-avatar-box">
                    <img
                      src={org.avatarUrl}
                      alt={`${org.name} avatar`}
                      className="org-avatar"
                      loading="lazy"
                    />
                    <span className="org-avatar-badge" title="GitHub Verified Member">
                      <FaGithub />
                    </span>
                  </div>

                  <div className="org-title-info">
                    <div className="org-name-row">
                      <h3 className="org-name">{org.name}</h3>
                      <a
                        href={org.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="org-login-link"
                        data-cursor="disable"
                        onClick={playButtonClick}
                      >
                        @{org.login}
                      </a>
                    </div>
                    <div className="org-role-tag">
                      <span className="org-role-dot" />
                      <span>{org.role}</span>
                    </div>
                  </div>
                </div>

                {/* Visit Organization Button */}
                <a
                  href={org.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="org-visit-btn"
                  data-cursor="disable"
                  onClick={playButtonClick}
                >
                  <span>View Organization</span>
                  <MdArrowOutward />
                </a>
              </div>

              {/* Description */}
              <p className="org-description">{org.description}</p>

              {/* Meta Stats Pills */}
              <div className="org-meta-row">
                {org.location && (
                  <span className="org-meta-pill" title="Organization Location">
                    <FaLocationDot />
                    {org.location}
                  </span>
                )}
                <span className="org-meta-pill" title="Public Repositories">
                  <FaCodeBranch />
                  {org.publicRepos} {org.publicRepos === 1 ? "Repository" : "Repositories"}
                </span>
                <span className="org-meta-pill" title="Team Collaborators">
                  <FaUsers />
                  {org.membersCount ? `${org.membersCount} Members` : "Team"}
                </span>
                <span
                  className={`org-meta-pill ${isLiveSynced ? "verified-pill" : ""}`}
                  title={isLiveSynced ? "Real-time live data from GitHub API" : "Synced with GitHub data"}
                >
                  <span className="verified-dot" />
                  {isLiveSynced ? "Live GitHub Synced" : "GitHub Verified"}
                </span>
              </div>

              {/* Live Team Members Subsection */}
              {org.members && org.members.length > 0 && (
                <div className="org-members-section">
                  <div className="org-members-header">
                    <h4 className="org-section-mini-title">
                      <FaUsers className="mini-icon" /> Team Members &amp; Collaborators
                    </h4>
                    <span className="org-badge-count">{org.members.length} Members</span>
                  </div>

                  <div className="org-members-grid">
                    {org.members.map((member) => (
                      <a
                        key={member.login}
                        href={member.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="org-member-chip"
                        data-cursor="disable"
                        onClick={playButtonClick}
                        title={`View ${member.login}'s profile on GitHub`}
                      >
                        <img
                          src={member.avatarUrl}
                          alt={`${member.login} avatar`}
                          className="member-avatar"
                          loading="lazy"
                        />
                        <div className="member-info">
                          <span className="member-name">@{member.login}</span>
                          {member.role && <span className="member-role">{member.role}</span>}
                        </div>
                        <MdArrowOutward className="member-arrow" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Repositories Subsection (Dynamic & Sorted by Stars / Newest) */}
              {org.repositories && org.repositories.length > 0 && (
                <div className="org-repos-container">
                  <div className="org-repos-header">
                    <h4 className="org-section-mini-title">
                      <VscRepo className="mini-icon" /> Active Projects
                    </h4>
                    <div className="org-repos-meta-group">
                      <span className="org-sort-badge" title="Automatically sorted: Highest stars first, then newest pushed projects">
                        <FaStar style={{ color: "#fbbf24", fontSize: "11px" }} /> Top Stars &amp; Newest
                      </span>
                      <span className="org-badge-count">
                        {org.repositories.length} {org.repositories.length === 1 ? "Project" : "Projects"}
                      </span>
                    </div>
                  </div>

                  <div className="org-repos-grid">
                    {org.repositories.map((repo) => (
                      <a
                        key={repo.name}
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="org-repo-card"
                        data-cursor="disable"
                        onClick={playButtonClick}
                      >
                        <div className="org-repo-top">
                          <div className="org-repo-name-box">
                            <VscRepo className="org-repo-icon" />
                            <span className="org-repo-name">{repo.name}</span>
                          </div>
                          <MdArrowOutward className="org-repo-arrow" />
                        </div>

                        <p className="org-repo-desc">{repo.description}</p>

                        <div className="org-repo-footer">
                          <div className="org-repo-tags">
                            {repo.language && (
                              <span className="org-repo-lang">
                                <span className="lang-dot" />
                                {repo.language}
                              </span>
                            )}
                            {repo.stars !== undefined && repo.stars > 0 && (
                              <span className="org-repo-stars">
                                <FaStar /> {repo.stars}
                              </span>
                            )}
                            {repo.pushedAt && (
                              <span className="org-repo-date">
                                {formatRelativeDate(repo.pushedAt)}
                              </span>
                            )}
                          </div>

                          <span className="org-repo-explore">
                            View Repo ↗
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Organizations;
