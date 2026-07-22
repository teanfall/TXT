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

// 获取当前激活的 URL 输入框 (兼容 ST 各种不同的 API 界面)
function getActiveUrlInput() {
    // 涵盖 OpenAI, Claude, Kobold, TextGen 等常见 API 的输入框 ID
    const selectors = ['#api_url_text', '#api_url', '#api_url_kobold', '#api_url_novel', '#api_url_textgen'];
    for (let sel of selectors) {
        const el = $(sel);
        // 必须存在且在当前界面可见
        if (el.length && el.is(':visible')) {
            return el;
        }
    }
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
        urlInput.val(url).trigger('input').trigger('change');
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

// 强制注入 UI 的核心逻辑
function ensureUI() {
    const urlInput = getActiveUrlInput();
    
    if (urlInput) {
        let container = $('#api-preset-manager-container');
        
        // 如果容器不存在，则创建
        if (container.length === 0) {
            container = $('<div id="api-preset-manager-container" class="api-preset-controls"></div>');
            const btnAdd = $('<button class="menu_button">添加</button>').on('click', addPreset);
            const btnManage = $('<button class="menu_button">管理</button>').on('click', showManagePopup);
            container.append($('<span>API 预设: </span>')).append(btnAdd).append(btnManage);
        }
        
        // 确保容器始终在当前可见的输入框正上方
        // 如果容器的下一个元素不是当前的输入框，就把它移动过去
        if (!container.next().is(urlInput)) {
            urlInput.before(container);
        }
    } else {
        // 如果当前没有可见的输入框，隐藏或移除容器防止错位
        $('#api-preset-manager-container').detach();
    }
}

jQuery(async () => {
    // 使用 setInterval 每 1 秒检查一次。
    // 这是应对 ST 复杂且频繁变化的 UI 最稳妥的方法。
    setInterval(ensureUI, 1000);
});
