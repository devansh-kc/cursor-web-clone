import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

export const useConversations = (id: Id<"projects"> | null) => {
  return useQuery(
    api.conversations.getByProject,
    id ? { projectId: id } : "skip",
  );
};
export const useConversation = (id: Id<"conversations"> | null) => {
  return useQuery(api.conversations.getById, id ? { id } : "skip");
};

export const useMessages = (conversationId: Id<"conversations"> | null) => {
  return useQuery(
    api.conversations.getMessages,
    conversationId ? { conversationId } : "skip",
  );
};

export const useConversationsByProject = (projectId: Id<"projects"> | null) => {
  return useQuery(
    api.conversations.getByProject,
    projectId ? { projectId } : "skip",
  );
};

export const useCreateConversation = () => {
  return useMutation(api.conversations.create);
};
