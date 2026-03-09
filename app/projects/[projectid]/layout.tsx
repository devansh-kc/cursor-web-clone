import ProjectIdLayout from "@/app/features/projects/components/project-id-layout";
import React from "react";
import { Id } from "@/convex/_generated/dataModel";

async function layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectid: string }>;
}) {
  const { projectid } = await params;
  return (
    <ProjectIdLayout projectId={projectid as Id<"projects">}>
      {children}
    </ProjectIdLayout>
  );
}

export default layout;
