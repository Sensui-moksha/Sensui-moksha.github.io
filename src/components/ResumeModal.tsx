import React, { useEffect } from "react";
import { MdClose, MdDownload, MdArrowOutward } from "react-icons/md";
import { FaFilePdf } from "react-icons/fa6";
import { playButtonClick } from "../utils/audio";
import { lenis } from "./Navbar";
import "./styles/ResumeModal.css";

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ResumeModal: React.FC<ResumeModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      lenis?.stop();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        lenis?.start();
      };
    } else {
      lenis?.start();
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="resume-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playButtonClick();
          onClose();
        }
      }}
      data-cursor="disable"
    >
      <div className="resume-modal-card" role="dialog" aria-modal="true">
        {/* Header Bar */}
        <div className="resume-modal-header">
          <div className="resume-modal-title-group">
            <span className="resume-modal-icon">
              <FaFilePdf />
            </span>
            <div>
              <h3 className="resume-modal-title">Mokshyagna Yadav — Resume</h3>
              <p className="resume-modal-subtitle">Computer Science Engineering & Full-Stack</p>
            </div>
          </div>

          <div className="resume-modal-actions">
            <a
              href="/resume/resume.pdf"
              download="Mokshyagna_Yadav_Resume.pdf"
              className="resume-modal-btn resume-modal-btn-primary"
              onClick={playButtonClick}
              title="Download PDF"
            >
              <MdDownload />
              <span>Download</span>
            </a>

            <a
              href="/resume/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="resume-modal-btn resume-modal-btn-secondary"
              onClick={playButtonClick}
              title="Open in new tab"
            >
              <MdArrowOutward />
              <span>Full Tab</span>
            </a>

            <button
              className="resume-modal-btn resume-modal-btn-close"
              onClick={() => {
                playButtonClick();
                onClose();
              }}
              title="Close (Esc)"
              aria-label="Close Resume Preview"
            >
              <MdClose />
            </button>
          </div>
        </div>

        {/* PDF Viewer Frame */}
        <div className="resume-modal-body">
          <iframe
            src="/resume/resume.pdf#toolbar=0&navpanes=0&scrollbar=1"
            title="Mokshyagna Yadav Resume Preview"
            className="resume-pdf-frame"
          />
          <div className="resume-mobile-fallback">
            <p>Previewing on mobile or browser blocked iframe?</p>
            <a
              href="/resume/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="resume-fallback-btn"
              onClick={playButtonClick}
            >
              <MdArrowOutward /> Open PDF Directly
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeModal;
