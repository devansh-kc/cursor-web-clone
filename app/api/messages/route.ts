import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { inngest } from "@/inngest/client";
import { convex } from "@/lib/convex-client";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { success, z as Zod } from "zod";
const requestSchema = Zod.object({
  conversationId: Zod.string(),
  message: Zod.string(),
});
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const internalKey = process.env.CONVEX_INTERNAL_KEY;

  if (!internalKey)
    return NextResponse.json(
      { error: "Internal key not configured" },
      { status: 500 },
    );
  const body = await request.json();
  const { conversationId, message } = requestSchema.parse(body);
  const conversations = await convex.query(api.system.getConversationById, {
    internalKey: internalKey,
    conversationId: conversationId as Id<"conversations">,
  });

  if (!conversations) {
    return NextResponse.json(
      {
        error: "Conversation Not found",
      },
      {
        status: 404,
      },
    );
  }

  const projectId = conversations?.projectId;
  // Update the message status to cancelled
  const processingMessage = await convex.query(
    api.system.getProcessingMessages,
    {
      internalKey,
      projectId: projectId,
    },
  );

  if (processingMessage?.length > 0) {
    // cancel all processing request
    const cancelIds = await Promise.all(
      processingMessage.map(async (msg) => {
        await inngest.send({
          name: "message/cancel",
          data: {
            messageId: msg?._id,
          },
        });

        await convex.mutation(api.system.updateMessageStatus, {
          internalKey: internalKey,
          messageId: msg._id,
          status: "cancelled",
        });
        return msg._id;
      }),
    );
  }

  // Create user message
  await convex.mutation(api.system.createMessage, {
    internalKey,
    conversationId: conversationId as Id<"conversations">,
    projectId,
    role: "user",
    content: message,
  });

  // Create message assistant placeholder
  const assistantWithMessageId = await convex.mutation(
    api.system.createMessage,
    {
      internalKey,
      conversationId: conversationId as Id<"conversations">,
      projectId,
      role: "assistant",
      content: "",
      status: "processing",
    },
  );

  // Trigger Inngest function
  const event = await inngest.send({
    name: "message/sent",
    data: {
      message,
      conversationId: conversationId as Id<"conversations">,
      projectId,
      messageId: assistantWithMessageId,
    },
  });
  return NextResponse.json({
    success: true,
    eventId: event?.ids[0], // TODO: Later use event id
    messageId: assistantWithMessageId,
  });
}
