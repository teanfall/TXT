import { extension_settings } from '../../../extensions.js';
import { saveSettingsDebounced } from '../../../../script.js';
import { Popup } from '../../../popup.js';

const extensionName = 'api-preset-manager';

// 初始化设置
if (!extension_settings[extensionName]) {
    extension_settings[extensionName] = { presets: [] };
}

function savePresets() {
    saveSettingsDebounced();
}

// 获取当前激活的 URL 输入框 (适配 ST 不同的 API 界面)
function getActiveUrlInput() {
    const textInput = $('#api_url_text');
    const normalInput = $('#api_url');
    if (textInput.length && textInput.is(':visible')) return textInput;
    if (normalInput.length && normalInput.is(':visible')) return normalInput;
    return null;
}

// 添加预设
function addPreset() {
    const urlInput = getActiveUrlInput();
    if (!urlInput) {
        toastr.warning('未找到可用的 API URL 输入框');
        return;
    }
    
    const currentUrl = urlInput.val();
    if (!currentUrl) {
        toastr.warning('当前 URL 为空，无法添加');
        return;
    }

    const name = prompt('请输入此 API 预设的名称:');
    if (name) {
        extension_settings[extensionName].presets.push({ name, url: currentUrl });
        savePresets();
        toastr.success('预设已保存');
    }
}

// 应用预设
function applyPreset(url) {
    const urlInput = getActiveUrlInput();
    if (urlInput) {
        urlInput.val(url).trigger('input');
        toastr.success('已应用 API 预设');
    } else {
        toastr.error('无法应用：未找到 URL 输入框');
    }
}

// 管理预设面板
function showManagePopup() {
    const presets = extension_settings[extensionName].presets;
    if (presets.length === 0) {
        toastr.info('当前没有保存任何预设');
        return;
    }

    let html = '<div id="api-preset-list">';
    presets.forEach((p, index) => {
        html += `
        <div class="api-preset-item">
            <div class="api-preset-item-info">
                <span class="api-preset-item-name">${p.name}</span>
                <span class="api-preset-item-url">${p.url}</span>
            </div>
            <div>
                <button class="menu_button apply-preset-btn" data-url="${p.url}">应用</button>
                <button class="menu_button delete-preset-btn" data-index="${index}">删除</button>
            </div>
        </div>`;
    });
    html += '</div>';

    const popup = new Popup(html, 1, null, { title: '管理 API 预设' });
    popup.show();

    // 绑定弹出层内的按钮事件
    $('.apply-preset-btn').on('click', function() {
        applyPreset($(this).data('url'));
        popup.complete();
    });

    $('.delete-preset-btn').on('click', function() {
        const idx = $(this).data('index');
        extension_settings[extensionName].presets.splice(idx, 1);
        savePresets();
        popup.complete();
        showManagePopup(); // 刷新面板
    });
}

// 注入 UI
function injectUI() {
    if ($('.api-preset-controls').length > 0) return; // 避免重复注入

    const container = $('<div class="api-preset-controls"></div>');
    const btnAdd = $('<button class="menu_button">添加</button>').on('click', addPreset);
    const btnManage = $('<button class="menu_button">管理</button>').on('click', showManagePopup);
    
    container.append($('<span>API 预设: </span>')).append(btnAdd).append(btnManage);

    // 监听 DOM 变化，因为 ST 的 API 界面是动态切换的
    const observer = new MutationObserver(() => {
        const urlInput = getActiveUrlInput();
        if (urlInput && $('.api-preset-controls').length === 0) {
            urlInput.before(container);
        }
    });
    
    observer.observe(document.getElementById('api_settings') || document.body, { 
        childList: true, 
        subtree: true 
    });
}

jQuery(async () => {
    injectUI();
});
