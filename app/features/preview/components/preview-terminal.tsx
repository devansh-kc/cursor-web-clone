import React, { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
interface PreviewTerminalProps {
  output: string;
}

export const PreviewTerminal = ({ output }: PreviewTerminalProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const lastLengthRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current || terminalRef.current) return;

    const el = containerRef.current;

    const terminal = new Terminal({
      convertEol: true,
      disableStdin: true,
      fontSize: 12,
      fontFamily: "monospace",
      theme: {
        background: "#1f2228",
        foreground: "#e2e8f0", // ← add this, light gray text
        cursor: "#e2e8f0",
        selectionBackground: "#ffffff33",
      },
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon); // ← step 1: load addon
    terminal.open(el); // ← step 2: inject into DOM

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;
    requestAnimationFrame(() => fitAddon.fit());

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      terminal.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!terminalRef.current) return;

    if (output.length < lastLengthRef.current) {
      terminalRef.current.clear();
      lastLengthRef.current = 0;
    }

    const newData = output.slice(lastLengthRef.current);
    if (newData) {
      terminalRef.current.write(newData);
      lastLengthRef.current = output.length;
    }
  }, [output]);
  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 h-full w-full p-3 [&_.xterm]:h-full! [&_.xterm-viewport]:h-full! [&_.xterm-screen]:h-full! bg-sidebar"
    />
  );
};

export default PreviewTerminal;
