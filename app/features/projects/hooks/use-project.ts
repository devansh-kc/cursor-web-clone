import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import React from "react";

export function useProject() {
  return useQuery(api.projects.get);
}

export function useProjectPartial(limit: number) {
  return useQuery(api.projects.getPartial, { limit });
}

export function useCreateProject() {
  const { userId } = useAuth();
  return useMutation(api.projects.create).withOptimisticUpdate(
    (localStore, args) => {
      const existingProjects = localStore.getQuery(api.projects.get);

      if (existingProjects !== undefined) {
        const now = Date.now();
        const newProject = {
          ...args,
          _id: crypto.randomUUID() as Id<"projects">,
          _creationTime: now,
          name: args.name,
          ownerId: userId ?? "anonymous",
          updatedAt: now,
        };
        localStore.setQuery(api.projects.get, {}, [
          newProject,
          ...existingProjects,
        ]);
      }
    },
  );
}
