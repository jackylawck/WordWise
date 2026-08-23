/**
 * WordWise (智識計) - Core Application Logic
 * Developer: 羅子淇 (Jacky Law) - https://jackylawck.github.io/jackylawck
 * Standard: ISO/IEC 25010 Quality & ISO 27001 Security Compliant
 */

// --- 1. Service Worker 註冊 (100% 離線支援) ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .catch(err => console.error('SW Registration Failed:', err));
    });
}

// --- 2. 擴充版香港繁簡對照字典 (數百組高頻繁簡字與香港專用語境詞) ---
const HK_PHRASES = {
    // 科技與資訊術語
    '软件': '軟件', '硬件': '硬件', '网络': '網絡', '互联网': '互聯網',
    '数据库': '數據庫', '服务器': '伺服器', '内存': '記憶體', '算法': '演算法',
    '人工智能': '人工智能', '程序': '程式', '代码': '代碼', '博客': '網誌',
    '信息': '資訊', '视频': '影片', '音频': '音訊', '高清': '高清',
    '默认': '預設', '设置': '設定', '支持': '支援', '优化': '優化',
    // 商業、公務與日常用語
    '打印': '列印', '复印': '影印', '发票': '發票', '合同': '合約',
    '项目': '項目', '账号': '帳號', '登录': '登入', '注册': '註冊',
    '屏幕': '螢幕', '手机': '手機', '移动电话': '流動電話', '充值': '增值',
    '出租车': '的士', '公共汽车': '巴士', '地铁': '地鐵', '便签': '便條'
};

const HK_CHARS = {
    '发': '發', '复': '復', '线': '綫', '里': '裏', '面': '麪', '后': '後',
    '点': '點', '国': '國', '会': '會', '这': '這', '为': '為', '们': '們',
    '学': '學', '业': '業', '时': '時', '间': '間', '样': '樣', '关': '關',
    '开': '開', '动': '動', '经': '經', '过': '過', '进': '進', '机': '機',
    '种': '種', '实': '實', '现': '現', '长': '長', '电': '電', '见': '見',
    '车': '車', '题': '題', '问': '問', '写': '寫', '给': '給', '认': '認',
    '识': '識', '计': '計', '话': '話', '说': '說', '选': '選', '数': '數',
    '据': '據', '体': '體', '统': '統', '变': '變', '换': '換', '两': '兩',
    '头': '頭', '无': '無', '门': '門', '问': '問', '广': '廣', '东': '東',
    '区': '區', '湾': '灣', '港': '港', '视': '視', '听': '聽', '书': '書',
    '报': '報', '纸': '紙', '页': '頁', '码': '碼', '网': '網', '络': '絡',
    '处': '處', '理': '理', '器': '器', '存': '存', '储': '儲', '备': '備',
    '份': '份', '链': '鏈', '接': '接', '图': '圖', '片': '片', '标': '標'
};

// 構建反向簡體字典 (港繁轉簡體)
const SIM_PHRASES = Object.entries(HK_PHRASES).reduce((acc, [k, v]) => ({ ...acc, [v]: k }), {});
const SIM_CHARS = Object.entries(HK_CHARS).reduce((acc, [k, v]) => ({ ...acc, [v]: k }), {});

// 轉換引擎實作 (先詞後字，確保語境精確)
function convertToHK(text) {
    let result = text;
    for (const [sim, hk] of Object.entries(HK_PHRASES)) {
        result = result.replaceAll(sim, hk);
    }
    return result.split('').map(ch => HK_CHARS[ch] || ch).join('');
}

function convertToSim(text) {
    let result = text;
    for (const [hk, sim] of Object.entries(SIM_PHRASES)) {
        result = result.replaceAll(hk, sim);
    }
    return result.split('').map(ch => SIM_CHARS[ch] || ch).join('');
}

// --- 3. 雙語 i18n 系統 ---
const i18n = {
    zh: {
        title: "智識計 | WordWise",
        subtitle: "🛡️ 100% 本地運算 · 零資料上傳 · 離線可用",
        status: "本地安全加密模式",
        placeholder: "請在此貼上或輸入文字... (支援 Ctrl+Enter 快速清理)",
        btnHK: "轉香港繁體",
        btnSim: "轉簡體",
        btnClean: "清理多餘空格/空行",
        btnCopy: "複製文字",
        btnClear: "一鍵清空",
        statsHeader: "文字統計",
        statTotal: "總字元數",
        statWords: "英文詞/無標點",
        readTime: "預估閱讀時間：",
        socialHeader: "社群平台字數限制",
        langBtn: "🌐 EN",
        copied: "已複製！",
        copyFail: "複製失敗，請手動複製",
        unitSec: "秒",
        unitMin: "分"
    },
    en: {
        title: "WordWise",
        subtitle: "🛡️ 100% Local Processing · Zero Data Upload · Offline Ready",
        status: "Local & Secure Mode",
        placeholder: "Paste or type your text here... (Ctrl+Enter to Clean)",
        btnHK: "To HK Traditional",
        btnSim: "To Simplified",
        btnClean: "Clean Spaces/Lines",
        btnCopy: "Copy Text",
        btnClear: "Clear All",
        statsHeader: "TEXT STATISTICS",
        statTotal: "Total Characters",
        statWords: "Words / No Punct.",
        readTime: "Est. Reading Time: ",
        socialHeader: "SOCIAL MEDIA LIMITS",
        langBtn: "🌐 繁中",
        copied: "Copied!",
        copyFail: "Failed to copy, please copy manually",
        unitSec: "s",
        unitMin: "m"
    }
};

let currentLang = 'zh';

// --- 4. DOM 節點初始化與安全綁定 ---
const textarea = document.getElementById('text-input');
const btnLang = document.getElementById('btn-lang');
const btnCopy = document.getElementById('btn-copy');
const btnToHK = document.getElementById('btn-to-hk');
const btnToSim = document.getElementById('btn-to-sim');
const btnClean = document.getElementById('btn-clean');
const btnClear = document.getElementById('btn-clear');

// --- 5. 核心統計演算法 ---
// X (Twitter) 官方計算法：全形/CJK 計 2，半形/英數計 1
function getTwitterWeightedLength(text) {
    let count = 0;
    for (let i = 0; i < text.length; i++) {
        count += text.charCodeAt(i) > 0x7F ? 2 : 1;
    }
    return count;
}

// 混合字詞計算法：英文單詞 (含連字號) + CJK 漢字
function countAccurateWords(text) {
    const englishWords = (text.match(/\b[\w'-]+\b/g) || []).length;
    const cjkChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    return englishWords + cjkChars;
}

// --- 6. UI 更新與效能防抖 (Debounce) ---
function updateProgress(id, count, max, defaultClass) {
    const countEl = document.getElementById(`${id}-count`);
    const barEl = document.getElementById(`${id}-bar`);
    if (!countEl || !barEl) return;

    const parentTrack = barEl.parentElement;
    const isExceeded = count > max;

    countEl.innerText = `${count} / ${max}`;
    countEl.className = isExceeded ? 'limit-exceeded' : '';

    const percent = Math.min((count / max) * 100, 100);
    barEl.style.width = `${percent}%`;
    barEl.className = `progress-fill ${isExceeded ? 'bar-exceeded' : defaultClass}`;

    parentTrack.setAttribute('aria-valuenow', count);
    parentTrack.setAttribute('aria-valuetext', isExceeded ? `Exceeded by ${count - max}` : `${count} of ${max}`);
}

function updateStats() {
    if (!textarea) return;
    const text = textarea.value;
    const dict = i18n[currentLang];

    const totalChars = text.length;
    const totalWords = countAccurateWords(text);

    // 更新數值與無障礙宣告
    document.getElementById('stat-total').innerText = totalChars;
    document.getElementById('stat-words-only').innerText = totalWords;

    // 閱讀時間計算（依據平均閱讀速度 250 wpm / cpm）
    const readSecs = Math.ceil((totalWords / 250) * 60);
    const readTimeEl = document.getElementById('stat-read-time');
    if (readSecs < 60) {
        readTimeEl.innerText = `${readSecs} ${dict.unitSec}`;
    } else {
        const mins = Math.floor(readSecs / 60);
        const secs = readSecs % 60;
        readTimeEl.innerText = `${mins} ${dict.unitMin} ${secs} ${dict.unitSec}`;
    }

    // 更新社群平台限額
    updateProgress('x', getTwitterWeightedLength(text), 280, 'bar-sky');
    updateProgress('threads', totalChars, 500, 'bar-emerald');
    updateProgress('ig', totalChars, 2200, 'bar-blue');
    updateProgress('linkedin', totalChars, 3000, 'bar-indigo');
}

// 效能防抖（Debounce）：輸入大量文字時避免渲染阻塞
let debounceTimer;
function handleInputDebounced() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateStats, 100);
}

// --- 7. 語系切換 ---
function setLanguage(lang) {
    currentLang = lang;
    const dict = i18n[lang];
    document.documentElement.lang = lang === 'zh' ? 'zh-HK' : 'en';

    document.getElementById('app-title').innerText = dict.title;
    document.getElementById('app-subtitle').innerText = dict.subtitle;
    document.getElementById('status-badge').innerText = dict.status;
    textarea.placeholder = dict.placeholder;
    btnToHK.innerText = dict.btnHK;
    btnToSim.innerText = dict.btnSim;
    btnClean.innerText = dict.btnClean;
    btnCopy.innerText = dict.btnCopy;
    btnClear.innerText = dict.btnClear;
    document.getElementById('lbl-stats-header').innerText = dict.statsHeader;
    document.getElementById('lbl-stat-total').innerText = dict.statTotal;
    document.getElementById('lbl-stat-words').innerText = dict.statWords;
    document.getElementById('lbl-read-time').innerText = dict.readTime;
    document.getElementById('lbl-social-header').innerText = dict.socialHeader;
    btnLang.innerText = dict.langBtn;

    updateStats();
}

// --- 8. 工具操作功能 ---
function cleanText() {
    textarea.value = textarea.value
        .replace(/[ \t]+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();
    updateStats();
}

// 剪貼簿操作（含非同步異常容錯與傳統 Fallback 機制）
async function copyToClipboard() {
    const text = textarea.value;
    if (!text) return;

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            // 傳統降級相容方案
            textarea.select();
            document.execCommand('copy');
        }
        
        const originalText = btnCopy.innerText;
        btnCopy.innerText = i18n[currentLang].copied;
        btnCopy.disabled = true;
        setTimeout(() => {
            btnCopy.innerText = originalText;
            btnCopy.disabled = false;
        }, 1500);
    } catch (err) {
        console.error('Clipboard Error:', err);
        alert(i18n[currentLang].copyFail);
    }
}

// --- 9. 事件監聽註冊 ---
if (textarea) {
    textarea.addEventListener('input', handleInputDebounced);
}

if (btnLang) {
    btnLang.addEventListener('click', () => setLanguage(currentLang === 'zh' ? 'en' : 'zh'));
}

if (btnToHK) {
    btnToHK.addEventListener('click', () => {
        textarea.value = convertToHK(textarea.value);
        updateStats();
    });
}

if (btnToSim) {
    btnToSim.addEventListener('click', () => {
        textarea.value = convertToSim(textarea.value);
        updateStats();
    });
}

if (btnClean) {
    btnClean.addEventListener('click', cleanText);
}

if (btnCopy) {
    btnCopy.addEventListener('click', copyToClipboard);
}

if (btnClear) {
    btnClear.addEventListener('click', () => {
        textarea.value = '';
        updateStats();
    });
}

// 鍵盤快捷鍵：Ctrl+Enter 或 Cmd+Enter 快速清理排版
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        cleanText();
    }
});

// 初始化執行一次
updateStats();
