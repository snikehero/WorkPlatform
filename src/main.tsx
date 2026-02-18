import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/i18n/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { ToastProvider } from "@/components/ui/toast";

ReactDOM.createRoot(document.getElementById("app")!).render(
  <React.StrictMode>
    <I18nProvider initialLocale={useAuthStore.getState().preferredLanguage}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </ThemeProvider>
    </I18nProvider>
  </React.StrictMode>
);
