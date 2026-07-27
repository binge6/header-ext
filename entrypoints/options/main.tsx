import "@/src/styles/app.css";
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "@/src/ui";
import App from "./App.tsx";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
