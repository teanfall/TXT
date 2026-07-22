import { extension_settings } from '../../../extensions.js';
import { saveSettingsDebounced } from '../../../../script.js';
import { Popup } from '../../../popup.js';

const extensionName = 'api-preset-manager';

// 1. 启动证明！只要脚本运行了，就会弹出这个提示
setTimeout(() => {
    toastr.success('API 预设扩展已成功加载！正在寻找注入点...', '扩展状态');
}, 2000);

if (!extension_settings[extensionName]) {
    extension_settings[extensionName] = { presets: [] };
}

function savePresets() {
    saveSettingsDebounced();
}

// 2. 终极模糊搜索：寻找任何可见的、ID包含 url/proxy/endpoint 的输入框
function getActiveUrlInput() {
    // 在整个右侧设置面板中寻找
    let possibleInputs = $('#rm_api_block input[type="text"]:visible, #api_setup input[type="text"]:visible').filter(function() {
        let id = $(this).attr('id') || '';
        let placeholder = $(this).attr('placeholder') || '';
        // 只要 ID 或占位符里带有这些关键词，就认为是 URL 输入框
        return id.includes('url') || id.includes('proxy') || id.includes('endpoint') || id.includes('api_server') || placeholder.includes('http');
    });
    
    if (possibleInputs.length > 0) {
        return $(possibleInputs[0]); // 返回找到的第一个
    }
    return null;
}

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

function applyPreset(url) {
    const urlInput = getActiveUrlInput();
    if (urlInput) {
        urlInput.val(url).trigger('input').trigger('change');
        toastr.success('已应用 API 预设');
    } else {
        toastr.error('无法应用：未找到 URL 输入框');
    }
}

function showManagePopup() {
    const presets = extension_settings[extensionName].presets;
    if (presets.length === 0) {
        toastr.info('当前没有保存任何预设');
        return;
    }
    let html = '<div id="api-preset-list">';
    presets.forEach((p, index) => {
        html += `
        <div class="api-preset-item" style="display:flex; justify-content:space-between; margin-bottom:5px; background:var(--SmartThemeBlurTintColor); padding:5px; border-radius:5px;">
            <div style="display:flex; flex-direction:column;">
                <strong>${p.name}</strong>
                <span style="font-size:0.8em; opacity:0.8;">${p.url}</span>
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
        showManagePopup();
    });
}

function ensureUI() {
    const urlInput = getActiveUrlInput();
    
    if (urlInput) {
        let container = $('#api-preset-manager-container');
        if (container.length === 0) {
            // 加上显眼的背景色，防止被透明化隐藏
            container = $('<div id="api-preset-manager-container" style="display:flex; gap:10px; margin-bottom:5px; align-items:center; background:rgba(0,0,0,0.2); padding:5px; border-radius:5px;"></div>');
            const btnAdd = $('<button class="menu_button">添加预设</button>').on('click', addPreset);
            const btnManage = $('<button class="menu_button">管理预设</button>').on('click', showManagePopup);
            container.append($('<span style="font-weight:bold;">API 预设: </span>')).append(btnAdd).append(btnManage);
        }
        
        if (!container.next().is(urlInput)) {
            urlInput.before(container);
        }
    } else {
        $('#api-preset-manager-container').detach();
    }
}

jQuery(async () => {
    setInterval(ensureUI, 1000);
});
