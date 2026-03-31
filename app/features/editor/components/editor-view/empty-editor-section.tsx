import React from "react";
import {
  FileCode2,
  FolderOpen,
  Terminal,
  Search,
  GitBranch,
  Command,
  Plus,
  Layers,
} from "lucide-react";

const shortcuts = [
  {
    keys: ["⌘", "P"],
    label: "Quick Open",
    icon: Search,
    desc: "Search files by name",
  },
  {
    keys: ["⌘", "N"],
    label: "New File",
    icon: Plus,
    desc: "Create a new file",
  },
  {
    keys: ["⌘", "`"],
    label: "Terminal",
    icon: Terminal,
    desc: "Toggle terminal panel",
  },
  {
    keys: ["⌘", "⇧", "E"],
    label: "Explorer",
    icon: FolderOpen,
    desc: "Browse project files",
  },
];

const recentActions = [
  { icon: Layers, label: "Open recent project", subtle: true },
  { icon: GitBranch, label: "Clone repository", subtle: true },
  { icon: Command, label: "Command palette", subtle: true },
];

function EmptyEditorState() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full select-none relative overflow-hidden bg-background">
      {/* Animated grid background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--muted-foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--muted-foreground)) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Radial glow from center */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 600px 400px at 50% 40%, hsl(var(--editor-glow) / 0.07), transparent)`,
        }}
      />

      {/* Secondary accent glow */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 400px 300px at 60% 50%, hsl(var(--accent) / 0.04), transparent)`,
        }}
      />

      {/* Floating code icon */}
      <div className="relative mb-8 group cursor-default">
        <div
          className="absolute -inset-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{
            background: `radial-gradient(circle, hsl(var(--editor-glow) / 0.12), transparent 70%)`,
          }}
        />
        <div
          className="relative w-20 h-20 rounded-2xl border border-border/60 flex items-center justify-center backdrop-blur-sm bg-secondary/40 shadow-lg"
          style={{ boxShadow: `0 0 40px -10px hsl(var(--editor-glow) / 0.15)` }}
        >
          <FileCode2 className="w-9 h-9 text-primary/60" strokeWidth={1.2} />
        </div>
        {/* Decorative dots */}
        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary/30 animate-pulse" />
        <div
          className="absolute -bottom-1 -left-1 w-1.5 h-1.5 rounded-full bg-accent/40 animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-foreground/90 mb-1.5 tracking-tight">
        No file open
      </h2>
      <p className="text-sm text-muted-foreground mb-10 max-w-xs text-center leading-relaxed">
        Open a file from the sidebar or use shortcuts below
      </p>

      {/* Shortcut grid */}
      <div className="grid grid-cols-2 gap-2.5 w-full max-w-md px-6 mb-8">
        {shortcuts.map(({ keys, label, icon: Icon, desc }) => (
          <button
            key={label}
            className="group/card flex items-start gap-3 px-4 py-3.5 rounded-xl 
              bg-secondary/30 border border-border/40 
              hover:bg-secondary/60 hover:border-primary/20 hover:shadow-md
              transition-all duration-300 cursor-pointer text-left"
            style={{
              boxShadow: "none",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow =
                `0 4px 24px -8px hsl(var(--editor-glow) / 0.1)`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            <div className="w-8 h-8 rounded-lg bg-muted/50 border border-border/30 flex items-center justify-center shrink-0 mt-0.5 group-hover/card:border-primary/20 group-hover/card:bg-primary/5 transition-all duration-300">
              <Icon
                className="w-4 h-4 text-muted-foreground/60 group-hover/card:text-primary/80 transition-colors duration-300"
                strokeWidth={1.5}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-foreground/80 group-hover/card:text-foreground transition-colors">
                {label}
              </span>
              <span className="text-[11px] text-muted-foreground/50 mt-0.5 truncate">
                {desc}
              </span>
              <div className="flex items-center gap-1 mt-1.5">
                {keys.map((key, i) => (
                  <React.Fragment key={key + i}>
                    {i > 0 && (
                      <span className="text-muted-foreground/20 text-[10px]">
                        +
                      </span>
                    )}
                    <kbd className="text-[10px] text-muted-foreground/60 bg-background/80 border border-border/60 rounded-[4px] px-1.5 py-0.5 font-mono leading-none shadow-sm">
                      {key}
                    </kbd>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 w-full max-w-md px-6 mb-6">
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/30 font-medium">
          or
        </span>
        <div className="flex-1 h-px bg-border/40" />
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-2 px-6">
        {recentActions.map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground/50 hover:text-muted-foreground/80 hover:bg-secondary/30 border border-transparent hover:border-border/30 transition-all duration-200 cursor-pointer"
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-6 flex items-center gap-1.5 text-[11px] text-muted-foreground/25">
        <kbd className="bg-background/60 border border-border/40 rounded px-1.5 py-0.5 font-mono text-[10px]">
          ⌘
        </kbd>
        <kbd className="bg-background/60 border border-border/40 rounded px-1.5 py-0.5 font-mono text-[10px]">
          K
        </kbd>
        <span className="ml-1">to open command palette</span>
      </div>
    </div>
  );
}

export default EmptyEditorState;
