import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // The API caches server-side already; refetching on every window focus
            // would spend the upstream rate limit for data we know is fresh.
            refetchOnWindowFocus: false,
            staleTime: 60000,
            gcTime: 10 * 60000,
        },
    },
});
const container = document.getElementById("root");
if (!container)
    throw new Error("Root element #root is missing from index.html");
createRoot(container).render(_jsx(StrictMode, { children: _jsx(QueryClientProvider, { client: queryClient, children: _jsx(BrowserRouter, { children: _jsx(App, {}) }) }) }));
