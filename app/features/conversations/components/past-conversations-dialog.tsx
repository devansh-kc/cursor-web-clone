"use client";

import { Id } from "@/convex/_generated/dataModel";
import { useConversations } from "../hooks/use-conversations";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface PastConversationDialogProps {
  projectId: Id<"projects">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (conversationId: Id<"conversations">) => void;
}

export const PastConversationDialog = ({
  projectId,
  open,
  onOpenChange,
  onSelect,
}: PastConversationDialogProps) => {
  const conversations = useConversations(projectId);
  const handleSelect = (conversationId: Id<"conversations">) => {
    onSelect(conversationId);
    onOpenChange(false);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Past conversations"
      description="Select a past conversation to continue"
    >
      <CommandList>
        <CommandEmpty>No conversations found.</CommandEmpty>
        <CommandInput placeholder="Search conversations..." />
        <CommandGroup heading="Past conversations">
          {conversations?.map((conversation) => (
            <CommandItem
              key={conversation._id}
              value={conversation.title}
              onSelect={() => handleSelect(conversation._id)}
            >
              {conversation.title}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
