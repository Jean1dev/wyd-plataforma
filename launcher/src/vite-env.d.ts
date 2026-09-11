/// <reference types="vite/client" />
import type { LauncherApi } from "../electron/preload";
declare global { interface Window { launcher: LauncherApi; } }
