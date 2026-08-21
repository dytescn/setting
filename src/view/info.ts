// src/view/info.ts
export const info_tpl = `
<ul class="pages-personal">
  <li class="pages-personal-li row" id="profile_description">
    <div class="flex-auto">
      <p class="text font-size-14 color-gray-900">对话凭证（AppKey / AppToken）</p>
      <p class="span mt-4 font-size-12 color-gray-500" id="appkey_display">
        AppKey: <%= it.appkey || '未设置' %> &nbsp;|&nbsp; AppToken: <%= it.apptoken || '未设置' %>
      </p>
    </div>
    <button class="vg-btn btn-size-md" id="info_edit_btn">编辑信息</button>
  </li>
</ul>
`;