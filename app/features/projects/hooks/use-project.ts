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

export function useGetProjectById(id: Id<"projects">) {
  return useQuery(api.projects.getProjectById, { id });
}

export function useRenameProjectById(projectId: Id<"projects">) {
  return useMutation(api.projects.renameProjectById).withOptimisticUpdate(
    (localStore, args) => {
      const existingSpecificProjects = localStore.getQuery(
        api.projects.getProjectById,
        {
          id: projectId,
        },
      );

      if (
        existingSpecificProjects !== undefined &&
        existingSpecificProjects !== null
      ) {
        localStore.setQuery(
          api.projects.getProjectById,
          { id: args.id },
          {
            ...existingSpecificProjects,
            name: args.name,
            updatedAt: Date.now(),
          },
        );
      }

      const existingProjects = localStore.getQuery(api.projects.get);

      if (existingProjects !== undefined) {
        const now = Date.now();
        localStore.setQuery(
          api.projects.get,
          {},
          existingProjects?.map((project) => {
            if (project._id === args.id) {
              return {
                ...project,
                name: args.name,
                updatedAt: now,
              };
            }
            return project;
          }),
        );
      }
    },
  );
}
