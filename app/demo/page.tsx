"use client";
import { Button } from "@/components/ui/button";
import React from "react";

function page() {
  const handleClickBlocking = async () => {
    await fetch("/api/demo/blocking", { method: "POST" });
  };
  const handleBackGround = async () => {
    await fetch("/api/demo/background", { method: "POST" });
  };
  return (
    <div className="p-8 space-x-4">
      <Button onClick={handleClickBlocking}>blocking</Button>
      <Button onClick={handleBackGround}>backround</Button>
    </div>
  );
}

export default page;
