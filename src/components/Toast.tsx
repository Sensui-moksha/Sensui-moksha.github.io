import React, { useEffect, useState } from "react";
import { FaCheck } from "react-icons/fa6";
import "./styles/Toast.css";
import { ToastEventDetail } from "../utils/toast";

interface ToastState {
  id: number;
  message: string;
}

const Toast: React.FC = () => {
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<ToastEventDetail>;
      if (!customEvent.detail || !customEvent.detail.message) return;

      const duration = customEvent.detail.duration || 3000;
      setToast({
        id: Date.now(),
        message: customEvent.detail.message,
      });

      clearTimeout(timer);
      timer = setTimeout(() => {
        setToast(null);
      }, duration);
    };

    window.addEventListener("app-toast", handleToast);
    return () => {
      window.removeEventListener("app-toast", handleToast);
      clearTimeout(timer);
    };
  }, []);

  if (!toast) return null;

  return (
    <div className="app-toast-container" data-cursor="disable">
      <div className="app-toast">
        <span className="app-toast-icon">
          <FaCheck />
        </span>
        <span className="app-toast-message">{toast.message}</span>
      </div>
    </div>
  );
};

export default Toast;
