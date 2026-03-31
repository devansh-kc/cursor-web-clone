"use client";
import React, { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Poppins } from "next/font/google";
import { UserButton } from "@clerk/nextjs";
import { useGetProjectById, useRenameProjectById } from "../hooks/use-project";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { CloudCheckIcon, LoaderIcon } from "lucide-react";
import { formatDistanceToNow } from "@/utils/date-formator-function/date-formator";

const font = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
function Navbar({ projectId }: { projectId: Id<"projects"> }) {
  const project = useGetProjectById(projectId);
  const renameProject = useRenameProjectById(projectId);
  const [isRename, setIsRename] = useState(false);
  const [name, setName] = useState("");
  function handleStartRename() {
    if (!project) {
      return;
    }
    setName(project.name);
    setIsRename(true);
  }
  function handleSubmit() {
    if (!project) return;
    setIsRename(false);
    const trimmedName = name.trim();
    if (trimmedName === "" || trimmedName === project?.name) {
      return;
    }

    renameProject({
      id: projectId,
      name,
    });
  }
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "Escape") {
      setIsRename(false);
    }
  }
  return (
    <nav className="flex justify-between items-center gap-x-2 p-2 bg-sidebar border-b  ">
      <div className="flex items-center gap-x-2">
        <Breadcrumb>
          <BreadcrumbList className="gap-x-0!">
            <BreadcrumbItem>
              <BreadcrumbLink className="flex items-center gap-1.5" asChild>
                <Button variant={"ghost"} className="w-fit!  p-1.5! h-7!">
                  <Link href="/" className="flex items-center gap-1.5">
                    <Image src="/logo.svg" alt="logo" width={20} height={20} />
                    <span className={cn("text-sm font-medium", font.className)}>
                      Cursor Clone
                    </span>
                  </Link>
                </Button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage onClick={handleStartRename}>
                {isRename ? (
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onBlur={handleSubmit}
                    onKeyDown={handleKeyDown}
                    className="text-sm bg-transparent text-foreground outline-none  focus:ring-1 focus:ring-inset focus:ring-ring  font-medium max-w-40 truncate"
                  />
                ) : (
                  (project?.name ?? "Project Name")
                )}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <TooltipProvider>
          {project?.importStatus === "importing" ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>Importing...</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <CloudCheckIcon className="size-4  text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                Saved{" "}
                {project?.updatedAt
                  ? formatDistanceToNow(project?.updatedAt)
                  : "unknown"}
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>
      <div className="flex items-center gap-x-2">
        <UserButton />
      </div>
    </nav>
  );
}

export default Navbar;
