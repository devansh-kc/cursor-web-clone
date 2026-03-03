import ProjectIdLayout from "@/app/features/projects/components/project-id-layout";
import ProjectIdView from "@/app/features/projects/components/project-id-view";

export default async function Page({
  params,
}: {
  params: Promise<{ projectid: string }>;
}) {
  const { projectid } = await params;
  return <ProjectIdView projectId={projectid} />;
}
