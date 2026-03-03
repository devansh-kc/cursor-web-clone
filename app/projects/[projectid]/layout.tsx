import ProjectIdLayout from "@/app/features/projects/components/project-id-layout";
import React from "react";

async function layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectid: string }>;
}) {
  const { projectid } = await params;
  return <ProjectIdLayout projectId={projectid}>{children}</ProjectIdLayout>;
}

export default layout;
