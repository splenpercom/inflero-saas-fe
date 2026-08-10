
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { applyDocumentFavicon } from "./app/lib/branding";
import { disableNumberInputMouseWheel } from "./app/lib/disableNumberInputMouseWheel";

applyDocumentFavicon();
disableNumberInputMouseWheel();

createRoot(document.getElementById("root")!).render(<App />);
