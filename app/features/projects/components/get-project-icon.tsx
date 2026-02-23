import { Doc } from "@/convex/_generated/dataModel";
import { AlertCircleIcon, GlobeIcon, Loader2Icon } from "lucide-react";
import { FaGithub } from "react-icons/fa";

export function getProjectIcon(projects: Doc<"projects">) {
  if (projects.importStatus === "completed") {
    <FaGithub className="size-3.5 text-muted-foreground" />;
  }
  if (projects.importStatus === "failed") {
    <AlertCircleIcon className="size-3.5 text-muted-foreground" />;
  }
  if (projects.importStatus === "importing") {
    <Loader2Icon className="size-3.5 text-muted-foreground " />;
  }
  return <GlobeIcon className="size-3.5 text-muted-foreground" />;
}
