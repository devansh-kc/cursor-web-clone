import { useEffect, useCallback, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { WebContainer } from "@webcontainer/api";
import { buildFileTree, getFilePath } from "../utils/file-tree";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useFiles } from "../../projects/hooks/use-files";
import { Container, Files } from "lucide-react";

let webcontainerInstance: WebContainer | null = null;
let bootingPromise: Promise<WebContainer> | null = null;
const getWebContainerInstance = async (): Promise<WebContainer> => {
  if (webcontainerInstance) return webcontainerInstance;
  if (!bootingPromise) {
    bootingPromise = WebContainer.boot({ coep: "credentialless" });
  }

  webcontainerInstance = await bootingPromise;
  return webcontainerInstance;
};
const tearDownWebContainer = () => {
  if (webcontainerInstance) {
    webcontainerInstance.teardown();

    webcontainerInstance = null;
  }
  bootingPromise = null;
};

interface UseWebContainerprops {
  projectId: Id<"projects">;
  enabled: boolean;
  settings?: {
    installCommand?: string;
    devCommand?: string;
  };
}
function Usewebcontainers({
  projectId,
  enabled,
  settings,
}: UseWebContainerprops) {
  const [status, setStatus] = useState<
    "idle" | "booting" | "running" | "installing" | "error"
  >("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restartKey, setRestartKey] = useState(0);
  const [terminalOutput, setTerminalOutput] = useState<string>("");
  const containerRef = useRef<WebContainer | null>(null);
  const hasStartedRef = useRef(false);

  const files = useFiles(projectId);

  // Boot the web container when enabled
  useEffect(() => {
    if (!enabled || !files || files.length === 0 || hasStartedRef.current)
      return;

    hasStartedRef.current = true;
    const start = async () => {
      try {
        setStatus("booting");
        setError(null);
        setTerminalOutput("");
        const appendOutput = (data: string) => {
          setTerminalOutput((prev) => prev + data);
        };

        const container = await getWebContainerInstance();
        containerRef.current = container;

        const fileTree = buildFileTree(files);
        await container.mount(fileTree);
        container.on("server-ready", (port, url) => {
          setPreviewUrl(url);
          setStatus("running");
        });
        setStatus("installing");

        const installCommand = settings?.installCommand || "npm install";
        const [installCommandName, ...installCommandArgs] =
          installCommand.split(" ");
        appendOutput(`$ ${installCommand}\n`);
        const installProcess = await container.spawn(
          installCommandName,
          installCommandArgs,
        );
        installProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              appendOutput(data);
            },
          }),
        );

        const installExitCode = await installProcess.exit;
        if (installExitCode !== 0) {
          setError("Installation failed. Check terminal output for details.");
          setStatus("error");
          throw new Error(
            `Installation ${installCommand} failed with exit code ${installExitCode}`,
          );
        }

        const devlopementCommand = settings?.devCommand || "npm run dev";
        const [devCommandName, ...devCommandArgs] =
          devlopementCommand.split(" ");
        appendOutput(`$ ${devlopementCommand}\n`);
        const devProcess = await container.spawn(
          devCommandName,
          devCommandArgs,
        );
      } catch (error) {
        console.log("Error booting WebContainer:", error);
        setError("Failed to start the development environment.");
        setStatus("error");
      }
    };
    start();
  }, [
    enabled,
    files,
    settings?.devCommand,
    settings?.installCommand,
    restartKey,
  ]);

  // Sync file changes (hot-reload)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !files || status !== "running") return;

    const filesMap = new Map(files.map((f) => [f._id, f]));

    for (const file of files) {
      if (file.type !== "file" || file.storageId || !file.content) continue;

      const filePath = getFilePath(file, filesMap);
      container.fs.writeFile(filePath, file.content);
    }
  }, [files, status]);

  // Reset when disabled
  useEffect(() => {
    if (!enabled) {
      hasStartedRef.current = false;
      setStatus("idle");
      setPreviewUrl(null);
      setError(null);
    }
  }, [enabled]);
  // Restart the entire WebContainer process
  const restart = useCallback(() => {
    tearDownWebContainer();
    containerRef.current = null;
    hasStartedRef.current = false;
    setStatus("idle");
    setPreviewUrl(null);
    setError(null);
    setRestartKey((k) => k + 1);
  }, []);

  return {
    status,
    previewUrl,
    error,
    restart,
    terminalOutput,
  };
}

export default Usewebcontainers;
