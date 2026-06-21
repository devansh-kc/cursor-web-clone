import { Id } from "@/convex/_generated/dataModel";
import React from "react";
import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDeleteProject } from "../hooks/use-project";

interface DeleteProjectProps {
  projectId: Id<"projects">;
}

function DeleteProject({ projectId }: Readonly<DeleteProjectProps>) {
  const router = useRouter();
  const deleteProject = useDeleteProject();
  const [open, setOpen] = React.useState(false);

  const handleDelete = async () => {
    try {
      router.push("/");
      toast.success("Project deleted");
      await deleteProject({ id: projectId });
    } catch {
      toast.error("Failed to delete project");
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <div className="flex items-center gap-1.5 h-full px-3 cursor-pointer text-muted-foreground border-l hover:bg-accent/30">
          <Trash2Icon className="size-3.5" />
          <span className="text-sm">Delete</span>
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete project</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this project? This action cannot be
            undone. All files, conversations, and messages will be permanently
            deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={handleDelete}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteProject;
