import { Id } from "@/convex/_generated/dataModel";
import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useEditor } from "../../hooks/use-editor";
import { useFilePath } from "@/app/features/projects/hooks/use-files";
import { FileIcon } from "@react-symbols/icons/utils";

function FileBreadCrumbs({ projectId }: { projectId: Id<"projects"> }) {
  const { activeTabId } = useEditor(projectId);
  const filePath = useFilePath(activeTabId as Id<"files">);
  if (filePath === undefined || !activeTabId) {
    return (
      <div className="p-2 bg-background pl-4 border-b">
        <Breadcrumb>
          <BreadcrumbList className="sm:gap-0.5 gap-0.5">
            <BreadcrumbItem className="text-sm">
              <BreadcrumbPage>&nbsp;</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    );
  }
  return (
    <div className="p-2 bg-background pl-4 border-b">
      <Breadcrumb>
        <BreadcrumbList className="sm:gap-0.5 gap-0.5">
          {filePath?.map((file, index) => {
            const isLast = index === filePath.length - 1;
            return (
              <React.Fragment key={file._id}>
                <BreadcrumbItem className="text-sm">
                  {isLast ? (
                    <BreadcrumbPage className="flex items-center gap-1">
                      <FileIcon
                        fileName={file.name}
                        autoAssign
                        className="size-4"
                      />
                      {file.name}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                      {file.name}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

export default FileBreadCrumbs;
