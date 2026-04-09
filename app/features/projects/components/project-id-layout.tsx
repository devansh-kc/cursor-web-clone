"use client";
import React from "react";
import Navbar from "./navbar";
import { Id } from "@/convex/_generated/dataModel";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import ConversationSidebar from "../../conversations/components/conversation-sidebar";

function ProjectIdLayout({
  children,
  projectId,
}: Readonly<{
  children: React.ReactNode;
  projectId: Id<"projects">;
}>) {
  const MIN_SIDEBAR_WIDTH = 200;
  const MAX_SIDEBAR_WIDTH = 800;
  const DEFAULT_CONVERSATION_SIDEBAR_WIDTH = 400;
  const DEFAULT_MAIN_SIZE = 1000;

  return (
    <div className="w-full h-screen flex flex-col">
      <Navbar projectId={projectId} />

      <div className="flex-1 overflow-hidden">
        <Allotment
          className="flex-1"
          defaultSizes={[DEFAULT_CONVERSATION_SIDEBAR_WIDTH, DEFAULT_MAIN_SIZE]}
        >
          <Allotment.Pane>{children}</Allotment.Pane>
          <Allotment.Pane
            snap
            minSize={MIN_SIDEBAR_WIDTH}
            maxSize={MAX_SIDEBAR_WIDTH}
            preferredSize={DEFAULT_CONVERSATION_SIDEBAR_WIDTH}
          >
            <ConversationSidebar projectId={projectId} />
          </Allotment.Pane>
        </Allotment>
      </div>
    </div>
  );
}

export default ProjectIdLayout;
