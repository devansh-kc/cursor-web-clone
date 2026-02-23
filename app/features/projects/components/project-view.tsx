"use client";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Poppins } from "next/font/google";
import Image from "next/image";
import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { SparkleIcon } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { FaGithub } from "react-icons/fa";
import ProjectList from "./project-list";
import { useCreateProject } from "../hooks/use-project";
import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from "unique-names-generator";
import ProjectCommandDialog from "./project-command-dialog";
const font = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

function ProjectsView() {
  const createProject = useCreateProject();
  const [openCommandDialog, setOpenCommandDialog] = React.useState(false);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "j" && e.ctrlKey) {
        e.preventDefault();
        setOpenCommandDialog(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  return (
    <>
      <div className="min-h-screen bg-sidebar flex flex-col items-center justify-center p-6 md:p-16">
        <div className="w-full max-w-sm mx-auto flex flex-col gap-4 items-center">
          <div className="w-full justify-between flex  gap-4 items-center">
            <div className="flex items-center gap-2 w-full group/logo">
              <Image
                width={50}
                height={50}
                src="/logo.svg"
                alt="cursor-web-clone"
                className="size-4 md:size-6 "
              />
              <h1
                className={
                  (cn("text-4xl md:text-5xl font-semibold "), font.className)
                }
              >
                Cursor-web-clone
              </h1>
            </div>
          </div>
          <div className="flex flex-col gap-4 w-full">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={"outline"}
                onClick={() => {
                  const ProjectName = uniqueNamesGenerator({
                    dictionaries: [adjectives, colors, animals],
                    separator: "-",
                    length: 3,
                  });
                  createProject({ name: ProjectName });
                }}
                className="h-full items-start justify-start p-4 bg-background border flex flex-col gap-6 rounded-none"
              >
                <div className="flex items-center justify-between w-full">
                  <SparkleIcon className="size-4" />
                  <Kbd className="bg-accent border">Ctrl+J</Kbd>
                </div>
                <div>
                  <span className="text-sm">New</span>
                </div>
              </Button>
              <Button
                variant={"outline"}
                onClick={() => setOpenCommandDialog(true)}
                className="h-full items-start justify-start p-4 bg-background border flex flex-col gap-6 rounded-none"
              >
                <div className="flex items-center justify-between w-full">
                  <FaGithub className="size-4" />
                  <Kbd className="bg-accent border">Ctrl+O</Kbd>
                </div>
                <div>
                  <span className="text-sm">Open</span>
                </div>
              </Button>
            </div>
            <ProjectList onViewAll={() => {}} />
          </div>
        </div>
      </div>
      <ProjectCommandDialog
        open={openCommandDialog}
        onOpenChange={setOpenCommandDialog}
      />
    </>
  );
}

export default ProjectsView;
