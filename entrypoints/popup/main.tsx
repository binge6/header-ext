import "@/src/shared/styles/app.css";
import ReactDOM from "react-dom/client";
import { PopupApp } from "@/src/app/popup";
import { ErrorBoundary } from "@/src/shared/ui";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <PopupApp />
  </ErrorBoundary>,
);
