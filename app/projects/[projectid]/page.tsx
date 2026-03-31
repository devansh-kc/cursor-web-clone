import ProjectIdView from "@/app/features/projects/components/project-id-view";
import { Id } from "@/convex/_generated/dataModel";

export default async function Page({
  params,
}: {
  params: Promise<{ projectid: string }>;
}) {
  const { projectid } = await params;
  return <ProjectIdView projectId={projectid as Id<"projects">} />;
}
