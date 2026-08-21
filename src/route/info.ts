// src/route/info.ts
import { info_tpl } from "../view/info.ts";
import { getSetting, setSetting } from "../apis/setting.ts";
import { dialog_alert_tpl, dialog_confirm_tpl, dialog_input_tpl } from "../view/dialog.ts";
import type { Tpl } from "@funxdata/pages/tplstype";

const TplToHtml = (globalThis as any)["TplToHtml"] as Tpl;

// ---------- 通用对话框函数 ----------
async function showAlert(title: string, message: string): Promise<void> {
  const html = await TplToHtml.renderString(dialog_alert_tpl, { title, message });
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  const dialogBox = wrapper.firstElementChild as HTMLElement;
  document.body.appendChild(dialogBox);
  return new Promise((resolve) => {
    const btn = dialogBox.querySelector('#define') as HTMLButtonElement;
    btn.addEventListener('click', () => {
      dialogBox.remove();
      resolve();
    });
  });
}

async function showConfirm(title: string, message: string): Promise<boolean> {
  const html = await TplToHtml.renderString(dialog_confirm_tpl, { title, message });
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  const dialogBox = wrapper.firstElementChild as HTMLElement;
  document.body.appendChild(dialogBox);
  return new Promise((resolve) => {
    const confirmBtn = dialogBox.querySelector('#define') as HTMLButtonElement;
    const cancelBtn = dialogBox.querySelector('#cancel') as HTMLButtonElement;
    const close = (result: boolean) => {
      dialogBox.remove();
      resolve(result);
    };
    confirmBtn.addEventListener('click', () => close(true));
    cancelBtn.addEventListener('click', () => close(false));
  });
}

async function showInputDialog(params: {
  title: string;
  inputs: Array<{ id: string; label: string; value: string }>;
}): Promise<Record<string, string> | null> {
  const html = await TplToHtml.renderString(dialog_input_tpl, params);
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  const dialogBox = wrapper.firstElementChild as HTMLElement;
  document.body.appendChild(dialogBox);

  const inputs = params.inputs.map(input => {
    const el = dialogBox.querySelector(`#${input.id}`) as HTMLInputElement;
    if (el) {
      el.removeAttribute('disabled');
      el.removeAttribute('readonly');
      el.style.pointerEvents = 'auto';
    }
    return { id: input.id, element: el };
  });

  const confirmBtn = dialogBox.querySelector('#define') as HTMLButtonElement;
  const cancelBtn = dialogBox.querySelector('#cancel') as HTMLButtonElement;

  return new Promise((resolve) => {
    const close = (result: Record<string, string> | null) => {
      dialogBox.remove();
      resolve(result);
    };

    confirmBtn.addEventListener('click', () => {
      const values: Record<string, string> = {};
      inputs.forEach(({ id, element }) => {
        values[id] = element ? element.value : '';
      });
      close(values);
    });
    cancelBtn.addEventListener('click', () => close(null));
  });
}

// ---------- 渲染信息页 ----------
export const info_init = async () => {
  const appkey = await getSetting("appkey") || "";
  const apptoken = await getSetting("apptoken") || "";

  const container = document.getElementById("setting_content") as HTMLElement;
  container.innerHTML = await TplToHtml.renderString(info_tpl, { appkey, apptoken });

  bindEditButton();
};

// ---------- 绑定编辑按钮 ----------
function bindEditButton() {
  const editBtn = document.getElementById("info_edit_btn");
  if (!editBtn) return;

  editBtn.addEventListener("click", async () => {
    const currentKey = await getSetting("appkey") || "";
    const currentToken = await getSetting("apptoken") || "";

    const result = await showInputDialog({
      title: "编辑 AppKey 与 AppToken",
      inputs: [
        { id: "appkey", label: "AppKey", value: currentKey },
        { id: "apptoken", label: "AppToken", value: currentToken },
      ],
    });

    if (!result) return; // 用户取消

    // 直接保存，不再弹出二次确认或成功提示
    await setSetting("appkey", result.appkey);
    await setSetting("apptoken", result.apptoken);

    // 静默刷新，无任何弹窗
    await info_init();
  });
}