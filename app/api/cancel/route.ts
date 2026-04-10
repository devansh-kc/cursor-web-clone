import { success, z as Zod } from "zod";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { inngest } from "@/inngest/client";
import { Id } from "@/convex/_generated/dataModel";
import { convex } from "@/lib/convex-client";
import { api } from "@/convex/_generated/api";

const cancelSchema = Zod.object({
  projectId: Zod.string(),
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { projectId } = cancelSchema.parse(body);
    const internalKey = process.env.CONVEX_INTERNAL_KEY;
    if (!internalKey) {
      return NextResponse.json(
        { error: "Internal key not configured" },
        { status: 500 },
      );
    }
    // Cancel the Inngest function
    // Update the message status to cancelled
    const processingMessage = await convex.query(
      api.system.getProcessingMessages,
      {
        internalKey,
        projectId: projectId as Id<"projects">,
      },
    );
    if (processingMessage.length === 0) {
      return NextResponse.json({ success: true, cancelled: true });
    }

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
    return NextResponse.json({
      success: true,
      cancel: true,
      messageIds: cancelIds,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        error: "Failed to cancel message",
      },
      { status: 500 },
    );
  }
}
