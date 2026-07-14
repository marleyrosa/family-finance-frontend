"use client";

import { useEffect } from "react";

const SW_URL = "/sw.js?v=v3.0.1";

export default function PwaRegister() {
  useEffect(() => {
    let updateInterval = null;

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register(SW_URL)
          .then((registration) => {
            registration.update().catch(() => {});

            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              if (!newWorker) return;
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  newWorker.postMessage({ type: "SKIP_WAITING" });
                }
              });
            });

            updateInterval = window.setInterval(() => {
              registration.update().catch(() => {});
            }, 60 * 1000);
          })
          .catch(() => {});
      });

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          navigator.serviceWorker.getRegistration().then((registration) => {
            registration?.update().catch(() => {});
          });
        }
      });
    }

    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      window.deferredInstallPrompt = event;
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    return () => {
      if (updateInterval) {
        window.clearInterval(updateInterval);
      }
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  return null;
}
