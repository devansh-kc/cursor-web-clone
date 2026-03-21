import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Id } from "@/convex/_generated/dataModel";
import React from "react";
import { useEditor } from "../../hooks/use-editor";
import Tab from "./tab";

function TopNavigation({ projectId }: { projectId: Id<"projects"> }) {
  const { openTabs } = useEditor(projectId);
  return (
    <ScrollArea className="flex-1 ">
      <div className="flex items-center gap-1.5 h-full  cursor-pointer text-muted-foreground border-r bg-sidebar">
        {openTabs?.map((fileId: Id<"files">, index: number) => (
          <Tab
            key={fileId}
            fileId={fileId}
            isFirst={index === 0}
            projectId={projectId}
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

export default TopNavigation;
