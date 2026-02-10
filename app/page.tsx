"use client";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "@/components/ui/button";

export default function Home() {
  const projects = useQuery(api.projects.get);
  const createProject = useMutation(api.projects.create);
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Projects</h1>
          <p className="text-slate-400">Manage and organize your projects</p>
        </div>

        <Button
          onClick={() =>
            createProject({
              name: "New Project",
            })
          }
          className="mb-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          + Add Project
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map((task) => (
            <div
              key={task._id}
              className="bg-slate-700 hover:bg-slate-600 rounded-lg p-6 shadow-lg transition transform hover:scale-105 cursor-pointer border border-slate-600"
            >
              <h2 className="text-xl font-semibold text-white mb-2">
                {task.name}
              </h2>
              <p className="text-slate-400 text-sm">
                Owner: <span className="text-blue-400">{task.ownerId}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
