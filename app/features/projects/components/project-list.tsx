import React from "react";
import { useCreateProject, useProjectPartial } from "../hooks/use-project";
import { Spinner } from "@/components/ui/spinner";
import { Kbd } from "@/components/ui/kbd";
import { Doc } from "@/convex/_generated/dataModel";
import Link from "next/link";
import {
  AlertCircleIcon,
  ArrowRightIcon,
  Globe,
  GlobeIcon,
  Loader2Icon,
} from "lucide-react";
import { formatDistanceToNow } from "@/utils/date-formator-function/date-formator";
import { FaGithub } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { getProjectIcon } from "./get-project-icon";
interface ProjectListProps {
  onViewAll: () => void;
}

function ProjectItem({ data }: { data: Doc<"projects"> }) {
  return (
    <Link
      href={`/projects/${data._id}`}
      className="text-sm text-foreground/60 font-medium hover:text-foreground py-1 flex items-center justify-between w-full group"
    >
      <div className="flex items-center gap-2">
        {getProjectIcon(data)}
        <span className="truncate">{data.name}</span>
      </div>
      <span className="text-xs text-muted-foreground group-hover:text-foreground/60 transition-colors">
        {formatDistanceToNow(data.updatedAt)}
      </span>
    </Link>
  );
}
const ContinueCard = ({ data }: { data: Doc<"projects"> }) => {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground">Last updated</span>
      <Button
        variant="outline"
        asChild
        className="h-auto items-start justify-start p-4 bg-background border rounded-none flex flex-col gap-2"
      >
        <Link href={`/projects/${data._id}`} className="group">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {getProjectIcon(data)}
              <span className="font-medium truncate">{data.name}</span>
            </div>
            <ArrowRightIcon className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(data.updatedAt)}
          </span>
        </Link>
      </Button>
    </div>
  );
};

function ProjectList({ onViewAll }: Readonly<ProjectListProps>) {
  const projects = useProjectPartial(6);
  if (projects === undefined) return <Spinner className="size-4 text-ring" />;
  const [recentProject, ...otherProjects] = projects;

  return (
    <div className="flex flex-col gap-4">
      {recentProject ? <ContinueCard data={recentProject} /> : null}
      {otherProjects?.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className=" flex flex-row items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Recent Projects
            </span>
            <button className="flex items-center gap-2  text-muted-foreground text-xs hover:text-foreground transition-colors">
              <span>View All</span>
              <Kbd>Ctrl+K</Kbd>
            </button>
          </div>
          <ul className=" flex flex-col">
            {projects.map((project) => (
              <ProjectItem key={project._id} data={project} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ProjectList;
