import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { DEFAULT_CONVERSATION_TITLE } from "@/convex/constants";
import { CopyIcon, HistoryIcon, LoaderIcon, Plus } from "lucide-react";
import React, { useState } from "react";
import {
  useConversation,
  useConversations,
  useCreateConversation,
  useMessages,
} from "../hooks/use-conversations";
import { toast } from "sonner";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { apiFetcher } from "@/utils/api-fetcher-function/api-fetcher-function";
import { PastConversationDialog } from "./past-conversations-dialog";

interface ConversationSidebarProps {
  projectId: Id<"projects">;
}
function ConversationSidebar({
  projectId,
}: Readonly<ConversationSidebarProps>) {
  const [input, setInput] = useState<string>("");
  const [openHistory, setOpenHistory] = useState<boolean>(false);
  const [selectedConversationId, setSelectedConversationId] =
    useState<Id<"conversations"> | null>(null);
  const createConversation = useCreateConversation();
  const handleCreateConversation = async () => {
    try {
      const conversationId = await createConversation({
        projectId,
        title: DEFAULT_CONVERSATION_TITLE,
      });
      setSelectedConversationId(conversationId);
      return conversationId;
    } catch (error) {
      toast.error("Failed to create conversation");
      console.log(error);
      return null;
    }
  };
  const conversations = useConversations(projectId ?? "");
  const activeConversationId =
    selectedConversationId ?? conversations?.[0]?._id ?? null;
  const activeConversation = useConversation(activeConversationId);
  const conversationMessages = useMessages(activeConversationId);
  const isProcessing = conversationMessages?.some(
    (msg) => msg.status === "processing",
  );

  const handleCancel = async () => {
    try {
      await apiFetcher({
        url: "/api/cancel",
        timeout: 10000,
        options: {
          method: "POST",
          body: JSON.stringify({ projectId: projectId }),
        },
      });
    } catch (error) {
      console.log(error);
      toast.error("Failed to cancel message");
    }
  };
  const handleSubmit = async (message: PromptInputMessage) => {
    if (isProcessing && !message.text) {
      await handleCancel();
      setInput("");
      return;
    }
    let conversationId = activeConversationId;
    if (!conversationId) {
      conversationId = await handleCreateConversation();
      if (!conversationId) {
        return;
      }
    }
    const payload = {
      message: message?.text,
      conversationId: conversationId,
    };

    try {
      await apiFetcher({
        url: "/api/messages",
        timeout: 10000,
        options: {
          method: "POST",
          body: JSON.stringify(payload),
        },
      });
    } catch (error) {
      console.log(error);
      toast.error("Message Failed to send");
    }
    setInput("");
  };

  return (
    <div className="flex flex-col h-full  bg-sidebar">
      <div className="h-8.75 flex items-center justify-between border-b ">
        <div className="text-sm truncate pl-3">
          {activeConversation?.title ?? DEFAULT_CONVERSATION_TITLE}
        </div>
        <div className="flex items-center px-1 gap-1">
          <Button
            size="icon-xs"
            variant="highlight"
            onClick={() => setOpenHistory(true)}
          >
            <HistoryIcon className="size-3.5" />
          </Button>
          <Button
            onClick={handleCreateConversation}
            size="icon-xs"
            variant="highlight"
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      </div>
      <Conversation className="flex-1">
        <ConversationContent>
          {conversationMessages?.map((messages, messageIndex) => {
            return (
              <Message key={messages?._id} from={messages?.role}>
                <MessageContent>
                  {messages.status === "processing" ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <LoaderIcon className="size-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  ) : messages.status === "cancelled" ? (
                    <span className="text-muted-foreground italic">
                      Request cancelled
                    </span>
                  ) : (
                    <MessageResponse>{messages.content}</MessageResponse>
                  )}
                </MessageContent>
                {messages?.role === "assistant" &&
                  messages?.status === "completed" &&
                  messageIndex === (conversationMessages?.length ?? 0) - 1 && (
                    <MessageActions>
                      <MessageAction
                        onClick={() =>
                          navigator?.clipboard.writeText(messages?.content)
                        }
                        label="copy"
                      >
                        <CopyIcon className="size-3" />
                      </MessageAction>
                    </MessageActions>
                  )}
              </Message>
            );
          })}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="p-3">
        <PromptInput onSubmit={handleSubmit} className="mt-2">
          <PromptInputBody>
            <PromptInputTextarea
              placeholder="ask your favourite model"
              onChange={(event) => setInput(event.target.value)}
              value={input}
              disabled={isProcessing}
            ></PromptInputTextarea>
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools />
            <PromptInputSubmit
              disabled={isProcessing ? false : !input}
              status={isProcessing ? "streaming" : "ready"}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
      <PastConversationDialog
        projectId={projectId}
        open={openHistory}
        onOpenChange={setOpenHistory}
        onSelect={setSelectedConversationId}
      />
    </div>
  );
}

export default ConversationSidebar;
