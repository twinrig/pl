import { createFileRoute } from "@tanstack/react-router";
import { PlayBook } from "@/components/play-book";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <PlayBook />;
}
