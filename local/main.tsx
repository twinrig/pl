import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PlayBook } from "@/components/play-book";
import "@/styles.css";
import "./fonts.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <PlayBook />
    </StrictMode>,
  );
}
