import { useEffect } from "react";

export function useLeaveBeacon(url: string) {
  useEffect(() => {
    const sendLeave = () => navigator.sendBeacon(url, "");
    window.addEventListener("beforeunload", sendLeave);
    return () => {
      window.removeEventListener("beforeunload", sendLeave);
    };
  }, [url]);
}
