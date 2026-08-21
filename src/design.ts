import { setting_tpl } from "./view/app.ts"
import { design_init } from "./route/design.ts"
import type { Tpl } from "@funxdata/pages/tplstype";

const TplToHtml = (globalThis as any)["TplToHtml"] as Tpl;

const app_node =document.getElementById("app") as HTMLElement;
app_node.innerHTML = await TplToHtml.renderString(setting_tpl, { active: "design" });

await design_init();