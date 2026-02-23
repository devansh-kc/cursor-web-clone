import React from "react";
import {
  CommandDialog,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { AlertCircleIcon, GlobeIcon, Loader2Icon } from "lucide-react";
import { FaGithub } from "react-icons/fa";

import { useProject } from "../hooks/use-project";
import { useRouter } from "next/navigation";
import { getProjectIcon } from "./get-project-icon";
interface ProjectCommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
function ProjectCommandDialog({
  open,
  onOpenChange,
}: ProjectCommandDialogProps) {
  const projects = useProject();
  const router = useRouter();
  const handleSelectProject = (projectId: string) => {
    router.push(`/projects/${projectId}`);
    onOpenChange(false);
  };
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Projects"
      description="Search and navigate to your projects"
    >
      <CommandInput placeholder="Search projects..." />
      <CommandList>
        <CommandEmpty>No projects found.</CommandEmpty>
        <CommandGroup heading="Projects">
          {projects === undefined ? (
            <CommandItem>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Loading projects...
            </CommandItem>
          ) : (
            projects?.map((project) => (
              <CommandItem
                key={project._id}
                onSelect={() => handleSelectProject(project._id)}
              >
                {getProjectIcon(project)}
                {project.name}
              </CommandItem>
            ))
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export default ProjectCommandDialog;
