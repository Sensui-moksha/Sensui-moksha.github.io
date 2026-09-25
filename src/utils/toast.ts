import { config } from "../config";
import { playSuccess } from "./audio";

export interface ToastEventDetail {
  message: string;
  duration?: number;
}

export const showToast = (message: string, duration = 3000): void => {
  window.dispatchEvent(
    new CustomEvent<ToastEventDetail>("app-toast", {
      detail: { message, duration }
    })
  );
};

export const copyEmailToClipboard = async (
  email: string = config.contact.email
): Promise<void> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(email);
    } else {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = email;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    playSuccess();
    showToast(`Email copied: ${email}`);
  } catch {
    showToast(`Email: ${email}`);
  }
};
