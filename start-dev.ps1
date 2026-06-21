wt `
    new-tab -d "C:\Users\Admin\Desktop\cursor-clone" powershell -NoExit -Command "npx --ignore-scripts=false inngest-cli@latest dev" `; `
    split-pane -H -d "C:\Users\Admin\Desktop\cursor-clone" powershell -NoExit -Command "npx convex dev" `; `
    split-pane -V -d  "C:\Users\Admin\Desktop\cursor-clone" powershell -NoExit -Command "npm run dev" 