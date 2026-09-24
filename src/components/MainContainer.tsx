import { PropsWithChildren, useEffect, useState } from "react";
import About from "./About";
import Career from "./Career";
import Contact from "./Contact";
import Cursor from "./Cursor";
import Landing from "./Landing";
import Navbar from "./Navbar";
import SocialIcons from "./SocialIcons";
import WhatIDo from "./WhatIDo";
import Work from "./Work";
import Organizations from "./Organizations";
import TechStackNew from "./TechStackNew";
import CallToAction from "./CallToAction";
import Terminal from "./Terminal";
import setSplitText from "./utils/splitText";
import { initTheme } from "../utils/theme";
import { initGlobalAudioListeners } from "../utils/audio";

const MainContainer = ({ children }: PropsWithChildren) => {
  const [isDesktopView, setIsDesktopView] = useState<boolean>(
    window.innerWidth > 1024
  );
  const [isMobile] = useState<boolean>(window.innerWidth <= 768);
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false);

  useEffect(() => {
    // Initialize saved theme accent
    initTheme();

    // Initialize global audio feedback on tabs, buttons, and links
    const cleanupAudio = initGlobalAudioListeners();

    // Listen for terminal open requests
    const handleOpenTerminal = () => {
      setIsTerminalOpen(true);
    };
    window.addEventListener("open-terminal", handleOpenTerminal);

    const resizeHandler = () => {
      setSplitText();
      setIsDesktopView(window.innerWidth > 1024);
    };
    resizeHandler();
    window.addEventListener("resize", resizeHandler);

    return () => {
      cleanupAudio();
      window.removeEventListener("open-terminal", handleOpenTerminal);
      window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  return (
    <div className="container-main">
      <Cursor />
      <Navbar />
      <SocialIcons />
      <Terminal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
      />
      {isDesktopView && !isMobile && children}
      <div className="container-main">
        <Landing />
        <About />
        <WhatIDo />
        <Career />
        <Work />
        <Organizations />
        <TechStackNew />
        <CallToAction />
        <Contact />
      </div>
    </div>
  );
};

export default MainContainer;
