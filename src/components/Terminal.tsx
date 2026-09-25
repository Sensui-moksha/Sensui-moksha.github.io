import React, { useState, useEffect, useRef } from "react";
import "./styles/Terminal.css";
import { config } from "../config";
import { playClick, playTerminalKey, playSuccess, toggleSound } from "../utils/audio";
import { applyTheme, THEMES, getCurrentTheme, ThemeOption } from "../utils/theme";
import { lenis } from "./Navbar";

interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandEntry {
  command: string;
  output: React.ReactNode;
}

const ASCII_BANNER = `
  __  __       _        _                                    
 |  \\/  |     | |      | |                                   
 | \\  / | ___ | | _____| |__  _   _  __ _  __ _ _ __   __ _ 
 | |\\/| |/ _ \\| |/ / __| '_ \\| | | |/ _\` |/ _\` | '_ \\ / _\` |
 | |  | | (_) |   <\\__ \\ | | | |_| | (_| | (_| | | | | (_| |
 |_|  |_|\\___/|_|\\_\\___/_| |_|\\__, |\\__,_|\\__, |_| |_|\\__,_|
                                __/ |      __/ |            
                               |___/      |___/             
`;

const Terminal: React.FC<TerminalProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<CommandEntry[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isMatrixActive, setIsMatrixActive] = useState<boolean>(true);
  const [theme, setTheme] = useState<ThemeOption>(getCurrentTheme());

  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Listen for accent theme changes to dynamically restyle the terminal and rain
  useEffect(() => {
    setTheme(getCurrentTheme());
    const onThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<ThemeOption>;
      if (customEvent.detail) {
        setTheme(customEvent.detail);
      }
    };
    window.addEventListener("accent-theme-change", onThemeChange);
    return () => window.removeEventListener("accent-theme-change", onThemeChange);
  }, []);

  // Focus input, start matrix rain, and pause background Lenis scroll when opened
  useEffect(() => {
    if (isOpen) {
      setIsMatrixActive(true);
      lenis?.stop();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      playSuccess();
    } else {
      setIsMatrixActive(false);
      lenis?.start();
    }
    return () => {
      lenis?.start();
    };
  }, [isOpen]);

  // Scroll to bottom on history change
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [history]);

  // Handle matrix rain canvas with dynamic theme colors
  useEffect(() => {
    if (!isMatrixActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const chars = "01MOKSHYAGNAYADAV0123456789ABCDEF$#@*!<>{}[]=+/\\~|λπΣΩ";
    const fontSize = 16;
    const columns = Math.floor(width / fontSize);
    const drops: number[] = [];

    // Pre-populate drops vertically across the entire screen so rain cascades immediately!
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * (height / fontSize));
    }

    let animationId: number;

    const draw = () => {
      // Soft fade creates long, beautiful trailing streaks
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.fillRect(0, 0, width, height);

      ctx.font = `bold ${fontSize}px ui-monospace, SFMono-Regular, monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars.charAt(Math.floor(Math.random() * chars.length));
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        if (y > 0 && y < height + 50) {
          // Leading head character: glowing bright white
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = theme.hex;
          ctx.shadowBlur = 14;
          ctx.fillText(char, x, y);

          // Trailing character: glowing themed accent color
          if (y - fontSize > 0) {
            ctx.fillStyle = theme.hex;
            ctx.shadowColor = theme.hex;
            ctx.shadowBlur = 6;
            const prevChar = chars.charAt(Math.floor(Math.random() * chars.length));
            ctx.fillText(prevChar, x, y - fontSize);
          }
        }

        // Reset to top when off screen with random stagger
        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      ctx.shadowBlur = 0;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isMatrixActive, theme]);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          window.dispatchEvent(new CustomEvent("open-terminal"));
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const executeCommand = (rawCmd: string) => {
    const cmd = rawCmd.trim();
    if (!cmd) {
      inputRef.current?.focus();
      return;
    }

    playClick();

    // Update command history
    setCommandHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);

    const parts = cmd.split(" ");
    const mainCommand = parts[0].toLowerCase();
    const arg = parts.slice(1).join(" ").toLowerCase();

    let output: React.ReactNode = null;

    switch (mainCommand) {
      case "help":
      case "?":
        output = (
          <div>
            <div style={{ color: "var(--accentColor)", marginBottom: "6px", fontWeight: "600" }}>
              Available Commands:
            </div>
            <div>• <strong style={{ color: "var(--accentColor)" }}>about</strong> : Learn about Mokshyagna &amp; background</div>
            <div>• <strong style={{ color: "var(--accentColor)" }}>skills</strong> : List technical skills and tools</div>
            <div>• <strong style={{ color: "var(--accentColor)" }}>projects</strong> : View my verified software and engineering projects</div>
            <div>• <strong style={{ color: "var(--accentColor)" }}>orgs</strong> : View GitHub organizations &amp; team collaborations</div>
            <div>• <strong style={{ color: "var(--accentColor)" }}>experience</strong> : View career timeline and education</div>
            <div>• <strong style={{ color: "var(--accentColor)" }}>contact</strong> : Get email, GitHub, LinkedIn, and Instagram</div>
            <div>• <strong style={{ color: "var(--accentColor)" }}>resume</strong> : View or download resume</div>
            <div>• <strong style={{ color: "var(--accentColor)" }}>theme [name]</strong> : Change accent theme (purple, cyan, emerald, amber, rose)</div>
            <div>• <strong style={{ color: "var(--accentColor)" }}>sound</strong> : Toggle UI sound effects on/off</div>
            <div>• <strong style={{ color: "var(--accentColor)" }}>matrix</strong> : Toggle digital matrix rain background</div>
            <div>• <strong style={{ color: "var(--accentColor)" }}>sudo hire moksha</strong> : The fast-track recruitment protocol</div>
            <div>• <strong style={{ color: "var(--accentColor)" }}>clear</strong> : Clear terminal console</div>
            <div>• <strong style={{ color: "var(--accentColor)" }}>exit</strong> : Close terminal</div>
          </div>
        );
        break;

      case "about":
        output = (
          <div>
            <p><strong>{config.developer.fullName}</strong> — {config.developer.title}</p>
            <p style={{ marginTop: "6px", color: "rgba(255,255,255,0.8)" }}>{config.about.description}</p>
          </div>
        );
        break;

      case "skills":
        output = (
          <div>
            <div style={{ marginBottom: "8px" }}>
              <span style={{ color: "var(--accentColor)", fontWeight: "600" }}>Languages &amp; Core:</span> Python, C++, C, JavaScript, TypeScript, Kotlin, Bash
            </div>
            <div style={{ marginBottom: "8px" }}>
              <span style={{ color: "var(--accentColor)", fontWeight: "600" }}>Web &amp; Frameworks:</span> React, Next.js, Node.js, Express, FastAPI, Django, Flask, HTML5, CSS3
            </div>
            <div style={{ marginBottom: "8px" }}>
              <span style={{ color: "var(--accentColor)", fontWeight: "600" }}>AI / ML &amp; Data:</span> TensorFlow, PyTorch, Scikit-learn, OpenCV, NumPy, Pandas, LLMs
            </div>
            <div>
              <span style={{ color: "var(--accentColor)", fontWeight: "600" }}>Databases &amp; DevOps:</span> MongoDB, PostgreSQL, MySQL, Redis, Firebase, Docker, Linux, Git, AWS, Azure
            </div>
          </div>
        );
        break;

      case "projects":
        output = (
          <div>
            <div style={{ color: "var(--accentColor)", fontWeight: "600", marginBottom: "8px" }}>
              My Featured Repositories &amp; Projects:
            </div>
            {config.projects.map((p) => (
              <div key={p.id} style={{ marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px dashed rgba(255,255,255,0.1)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                  <span style={{ color: "var(--accentColor)", fontWeight: "600", fontSize: "14px" }}>
                    {p.title}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--accentColor)", background: "rgba(var(--accentRgba, 194, 164, 255), 0.12)", padding: "2px 8px", borderRadius: "10px", border: "1px solid rgba(var(--accentRgba, 194, 164, 255), 0.25)" }}>
                    {p.category}
                  </span>
                </div>
                <div style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.85)", marginTop: "4px" }}>
                  {p.description}
                </div>
                <div style={{ fontSize: "11.5px", color: "#aaa", marginTop: "3px" }}>
                  <strong>Stack:</strong> {p.technologies}
                </div>
                {p.url && (
                  <div style={{ marginTop: "5px" }}>
                    <a href={p.url} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "var(--accentColor)", fontWeight: "500" }}>
                      View on GitHub ↗
                    </a>
                  </div>
                )}
              </div>
            ))}
            <p style={{ marginTop: "8px", fontSize: "12px" }}>
              Explore all repositories:{" "}
              <a href={config.contact.github} target="_blank" rel="noreferrer">
                {config.contact.github}
              </a>
            </p>
          </div>
        );
        break;

      case "orgs":
      case "organizations":
      case "org":
        output = (
          <div>
            <div style={{ color: "var(--accentColor)", fontWeight: "600", marginBottom: "8px" }}>
              GitHub Organizations &amp; Team Collaborations:
            </div>
            {config.organizations.map((org) => (
              <div
                key={org.id}
                style={{
                  marginBottom: "14px",
                  paddingBottom: "10px",
                  borderBottom: "1px dashed rgba(255,255,255,0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "6px",
                  }}
                >
                  <span style={{ color: "var(--accentColor)", fontWeight: "600", fontSize: "14px" }}>
                    🏢 {org.name} (@{org.login})
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--accentColor)",
                      background: "rgba(var(--accentRgba, 194, 164, 255), 0.12)",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      border: "1px solid rgba(var(--accentRgba, 194, 164, 255), 0.25)",
                    }}
                  >
                    {org.role}
                  </span>
                </div>
                <div style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.85)", marginTop: "4px" }}>
                  {org.description}
                </div>
                <div style={{ fontSize: "11.5px", color: "#aaa", marginTop: "3px" }}>
                  📍 {org.location || "India"} &nbsp;|&nbsp; 📦 {org.publicRepos} Public Repositories &nbsp;|&nbsp; 👥 {org.membersCount} Members
                </div>
                {org.members && org.members.length > 0 && (
                  <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.75)", marginTop: "3px" }}>
                    👥 <strong style={{ color: "var(--accentColor)" }}>Collaborators:</strong>{" "}
                    {org.members.map((m) => `@${m.login}`).join(", ")}
                  </div>
                )}
                {org.repositories && org.repositories.length > 0 && (
                  <div style={{ marginTop: "6px" }}>
                    <div style={{ fontSize: "11px", color: "var(--accentColor)", fontWeight: "500" }}>
                      Featured Projects:
                    </div>
                    <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>
                      {org.repositories.map((repo) => (
                        <li key={repo.name} style={{ marginBottom: "2px" }}>
                          <a
                            href={repo.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "var(--accentColor)", textDecoration: "underline" }}
                          >
                            {repo.name}
                          </a>
                          {" "}- {repo.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div style={{ marginTop: "6px" }}>
                  <a
                    href={org.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: "12px", color: "var(--accentColor)", fontWeight: "500" }}
                  >
                    Visit Organization on GitHub ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        );
        break;

      case "experience":
        output = (
          <div>
            {config.experiences.map((exp, i) => (
              <div key={i} style={{ marginBottom: "8px" }}>
                <span style={{ color: "var(--accentColor)", fontWeight: "600" }}>{exp.period}</span> — {exp.position} @ {exp.company}
                <div style={{ fontSize: "12px", color: "#999" }}>{exp.description}</div>
              </div>
            ))}
          </div>
        );
        break;

      case "contact":
        output = (
          <div>
            <div>Email: <a href={`mailto:${config.contact.email}`}>{config.contact.email}</a></div>
            <div>GitHub: <a href={config.contact.github} target="_blank" rel="noreferrer">{config.contact.github}</a></div>
            <div>LinkedIn: <a href={config.contact.linkedin} target="_blank" rel="noreferrer">{config.contact.linkedin}</a></div>
            <div>Location: {config.social.location}, India</div>
          </div>
        );
        break;

      case "resume":
        window.dispatchEvent(new CustomEvent("open-resume"));
        output = (
          <div>
            Opening in-browser resume viewer... (<a href="/resume/resume.pdf" target="_blank" rel="noreferrer">Direct PDF link</a>)
          </div>
        );
        break;

      case "theme":
        if (arg) {
          const success = applyTheme(arg);
          if (success) {
            output = <div>Theme successfully switched to <span style={{ color: "var(--accentColor)", fontWeight: "bold" }}>{arg}</span>!</div>;
          } else {
            output = (
              <div>
                Unknown theme &apos;{arg}&apos;. Available themes: {THEMES.map((t) => t.id).join(", ")}.
              </div>
            );
          }
        } else {
          output = (
            <div>
              Current theme: <strong style={{ color: "var(--accentColor)" }}>{getCurrentTheme().name}</strong>.
              <br />
              Usage: <span style={{ color: "var(--accentColor)" }}>theme [purple | cyan | emerald | amber | rose]</span>
            </div>
          );
        }
        break;

      case "sound": {
        const enabled = toggleSound();
        output = <div>UI Sound Effects: <strong style={{ color: enabled ? "#4ade80" : "#ff5f56" }}>{enabled ? "ENABLED" : "MUTED"}</strong></div>;
        break;
      }

      case "matrix": {
        const next = !isMatrixActive;
        setIsMatrixActive(next);
        output = (
          <div>
            {next ? (
              <div style={{ color: "#00ff66", fontWeight: "bold" }}>
                [MATRIX PROTOCOL INITIATED] ⚡ Cascading digital rain online. Type &apos;matrix&apos; again to disable.
              </div>
            ) : (
              <div style={{ color: "#ff5f56", fontWeight: "bold" }}>
                [MATRIX PROTOCOL TERMINATED] Returning to default cyber terminal.
              </div>
            )}
          </div>
        );
        break;
      }

      case "sudo":
        if (cmd.toLowerCase() === "sudo hire moksha" || cmd.toLowerCase() === "sudo hire") {
          playSuccess();
          output = (
            <div className="terminal-success-box">
              <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "4px" }}>
                ACCESS GRANTED: Candidate Exceptional 🚀
              </div>
              <p style={{ margin: "4px 0" }}>
                You&apos;ve unlocked priority direct contact! Let&apos;s build intelligent systems together.
              </p>
              <div style={{ marginTop: "8px" }}>
                👉 Reach out directly at:{" "}
                <a href={`mailto:${config.contact.email}?subject=Exciting%20Opportunity`} style={{ fontWeight: "bold" }}>
                  {config.contact.email}
                </a>
              </div>
            </div>
          );
        } else {
          output = <div>sudo: {cmd.replace("sudo ", "")}: command requires root permissions. Try &apos;sudo hire moksha&apos;</div>;
        }
        break;

      case "clear":
        setHistory([]);
        setInput("");
        setTimeout(() => inputRef.current?.focus(), 10);
        return;

      case "whoami":
        output = <div>visitor@guest-workstation (permission level: recruiter / developer)</div>;
        break;

      case "date":
        output = <div>{new Date().toString()}</div>;
        break;

      case "exit":
        onClose();
        return;

      default:
        output = (
          <div>
            Command not recognized: <code style={{ color: "#ff5f56" }}>{cmd}</code>. Type <code style={{ color: "var(--accentColor)" }}>help</code> to see available options.
          </div>
        );
    }

    setHistory((prev) => [...prev, { command: cmd, output }]);
    setInput("");

    // Automatically re-focus and re-highlight the terminal prompt for seamless text entry
    setTimeout(() => {
      inputRef.current?.focus();
      if (bodyRef.current) {
        bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    playTerminalKey();

    if (e.key === "Enter") {
      executeCommand(input);
    } else if ((e.key === "?" && input === "") || e.key === "F1") {
      e.preventDefault();
      executeCommand("help");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIndex = historyIndex + 1;
        if (nextIndex < commandHistory.length) {
          setHistoryIndex(nextIndex);
          setInput(commandHistory[commandHistory.length - 1 - nextIndex]);
        }
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInput(commandHistory[commandHistory.length - 1 - nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  };

  return (
    <div 
      className={`terminal-overlay ${isMatrixActive ? "matrix-mode-active" : ""}`}
      onClick={onClose}
      data-lenis-prevent="true"
      onWheel={(e) => e.stopPropagation()}
    >
      {isMatrixActive && <canvas ref={canvasRef} className="matrix-canvas" />}
      <div 
        className={`terminal-window ${isMatrixActive ? "matrix-window" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.focus();
        }}
        data-lenis-prevent="true"
        onWheel={(e) => e.stopPropagation()}
      >
          {/* Top Bar */}
          <div className="terminal-header">
            <div className="terminal-controls">
              <button
                className="terminal-dot terminal-dot-close"
                onClick={onClose}
                title="Close"
              />
              <button
                className="terminal-dot terminal-dot-min"
                onClick={onClose}
                title="Minimize"
              />
              <button
                className="terminal-dot terminal-dot-max"
                onClick={(e) => {
                  e.stopPropagation();
                  executeCommand("help");
                }}
                title="Help"
              />
            </div>
            <div className="terminal-title">
              moksha@portfolio: <span className="terminal-title-accent">~</span> (bash)
            </div>
            <div className="terminal-close-hint">ESC or Cmd+K</div>
          </div>

          {/* Body */}
          <div 
            className="terminal-body" 
            ref={bodyRef}
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            onClick={() => inputRef.current?.focus()}
          >
            <pre className="terminal-banner">{ASCII_BANNER}</pre>
            <div className="terminal-welcome-text">
              Welcome to <span>Mokshyagna Yadav&apos;s</span> Interactive Terminal. Type <span>help</span> for available commands or tap a quick action below.
            </div>

            {/* History */}
            {history.map((entry, index) => (
              <div key={index} className="terminal-entry">
                <div className="terminal-command-line">
                  <span className="terminal-prompt">visitor@moksha:~$</span>
                  <span className="terminal-command-text">{entry.command}</span>
                </div>
                <div className="terminal-response">{entry.output}</div>
              </div>
            ))}

            {/* Current Input */}
            <div className="terminal-input-row">
              <span className="terminal-prompt">visitor@moksha:~$</span>
              <input
                ref={inputRef}
                type="text"
                className="terminal-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Quick Action Chips */}
          <div 
            className="terminal-quick-chips"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="terminal-chip-label">Quick:</span>
            <button
              className="terminal-chip"
              onClick={() => executeCommand("help")}
            >
              help
            </button>
            <button
              className="terminal-chip"
              onClick={() => executeCommand("skills")}
            >
              skills
            </button>
            <button
              className="terminal-chip"
              onClick={() => executeCommand("projects")}
            >
              projects
            </button>
            <button
              className="terminal-chip"
              onClick={() => executeCommand("resume")}
            >
              resume
            </button>
            <button
              className="terminal-chip"
              onClick={() => executeCommand("theme cyan")}
            >
              theme cyan
            </button>
            <button
              className="terminal-chip"
              onClick={() => executeCommand("matrix")}
            >
              matrix
            </button>
            <button
              className="terminal-chip terminal-chip-accent"
              onClick={() => executeCommand("sudo hire moksha")}
            >
              sudo hire moksha
            </button>
          </div>
        </div>
      </div>
  );
};

export default Terminal;
