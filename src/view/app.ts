// src/view/app.ts
export const setting_tpl = `
<div class="vg-mains flex1 row" id="main">
   <div class="flex-auto rowcolumn">
      <h5 class="h5 color-gray-800 font-weight-lg mt-32 mb-24 pl-32 pr-32">系统设置</h5>
        <ul class="vg-tabs mb-8 ml-32 mr-32" id="setting_tab">
          <li class="vg-tabs-li ${'<%= it.active === "info" ? "select" : "" %>'}" id="setting_tab_info">
            <a href="/setting/info">系统信息</a>
          </li>
          <li class="vg-tabs-li ${'<%= it.active === "design" ? "select" : "" %>'}" id="setting_tab_designsoft">
            <a href="/setting/design">设计软件</a>
          </li>
        </ul>
        <div class="flex-auto pl-32 pr-32" id="setting_content"></div>
    </div>
</div>
`;