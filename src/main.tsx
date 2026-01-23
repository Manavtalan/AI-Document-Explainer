import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { logFounderStatus } from "./lib/founderMode";

// Log founder mode status in dev
logFounderStatus();

createRoot(document.getElementById("root")!).render(<App />);
