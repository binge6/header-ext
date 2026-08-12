import "@/src/shared/styles/app.css";
import ReactDOM from "react-dom/client";
import { OptionsApp } from "@/src/app/options";
import { ErrorBoundary } from "@/src/shared/ui";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <OptionsApp />
  </ErrorBoundary>,
);
