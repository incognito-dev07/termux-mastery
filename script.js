let tutorialData = {};
let currentMode = 'beginner';
let currentSection = null;
let isLessonView = false;

const contentContainer = document.getElementById('contentContainer');
const backButtonContainer = document.getElementById('backButtonContainer');
const copyToast = document.getElementById('copyToast');
const navBeginner = document.getElementById('navBeginner');
const navMain = document.getElementById('navMain');

async function loadData() {
  try {
    const response = await fetch('lessons.json');
    const fullData = await response.json();
    const mode = getUrlParam('mode') || 'beginner';
    const section = getUrlParam('section');
    currentMode = mode;
    currentSection = section;
    tutorialData = mode === 'beginner' ? fullData['beginner-sections'] : fullData['main-sections'];
    updateNav();
    if (section && tutorialData[section]) {
      isLessonView = true;
      renderLessons(section);
    } else {
      isLessonView = false;
      renderTopics();
    }
  } catch (error) {
    console.error('Failed to load data:', error);
    contentContainer.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-secondary);">Failed to load content. Please refresh.</div>';
  }
}

function escapeHtml(str) { if (!str) return ''; return str.replace(/[&<>]/g, function(m) { if (m === '&') return '&amp;'; if (m === '<') return '&lt;'; if (m === '>') return '&gt;'; return m; }); }

function highlightCode(code) {
  if (!code) return '';
  const lines = code.split('\n');
  const highlighted = lines.map(line => {
    let escaped = escapeHtml(line);
    escaped = escaped.replace(/\b(pkg|apt|ls|cd|pwd|mkdir|touch|cat|cp|mv|rm|echo|nano|vim|git|ssh|wget|curl|python|node|npm|pip|termux-setup-storage|termux-change-repo|chsh|source|history|man|ping|ifconfig|ip|scp|rsync|nmap|traceroute|dig|nslookup|vncserver|sshd|passwd|whoami)\b/g, '<span class="cmd">$1</span>');
    escaped = escaped.replace(/\b(-[a-zA-Z]|--[a-zA-Z-]+)\b/g, '<span class="flag">$1</span>');
    if (line.trim().startsWith('#')) return `<span class="comment">${escaped}</span>`;
    const idx = line.indexOf('#');
    if (idx > 0) { const before = escaped.substring(0, idx); const after = escaped.substring(idx); return `${before}<span class="comment">${after}</span>`; }
    return escaped;
  });
  return highlighted.join('\n');
}

function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

function copyToClipboard(text) {
  try { navigator.clipboard.writeText(text); showToast('Copied!'); }
  catch(e) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Copied!');
  }
}

function showToast(msg) {
  copyToast.textContent = msg;
  copyToast.classList.add('show');
  setTimeout(() => copyToast.classList.remove('show'), 1800);
}

function getUrlParam(p) { const url = new URLSearchParams(window.location.search); return url.get(p); }

function updateUrl(params) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  window.history.pushState({}, '', url);
}

function goHome() {
  updateUrl({ mode: currentMode, section: null });
  currentSection = null;
  isLessonView = false;
  renderTopics();
}

function updateNav() {
  if (currentMode === 'beginner') { navBeginner.classList.add('active'); navMain.classList.remove('active'); }
  else { navMain.classList.add('active'); navBeginner.classList.remove('active'); }
}

navBeginner.addEventListener('click', function() {
  if (currentMode === 'beginner') return;
  currentMode = 'beginner';
  currentSection = null;
  isLessonView = false;
  updateUrl({ mode: 'beginner', section: null });
  updateNav();
  loadData();
});

navMain.addEventListener('click', function() {
  if (currentMode === 'main') return;
  currentMode = 'main';
  currentSection = null;
  isLessonView = false;
  updateUrl({ mode: 'main', section: null });
  updateNav();
  loadData();
});

function renderBeginnerBanner() {
  return `
    <div class="section-container" id="section-beginner-guide">
      <div class="section-header">
        <div class="icon-wrap"><i class="fas fa-rocket"></i></div>
        <h2>Start Here — Beginner Track</h2>
        <span class="count">4 lessons</span>
      </div>
      <div style="padding:16px 20px 20px;">
        <p style="color:var(--text-secondary);margin-bottom:14px;font-size:14px;line-height:1.7;">Never used a terminal? This track walks you through everything from scratch — no prior knowledge needed.</p>
        <a href="?mode=beginner" class="goto-beginner-btn">
          <span><i class="fas fa-arrow-right"></i> Launch Beginner Course</span>
          <i class="fas fa-chevron-right"></i>
        </a>
      </div>
    </div>
  `;
}

function renderTopicCard(id, section) {
  const count = section.items.length;
  return `
    <div class="topic-card" onclick="openSection('${id}')">
      <div class="topic-icon"><i class="fas ${section.icon}"></i></div>
      <div class="topic-info">
        <h3>${escapeHtml(section.title)}</h3>
        <span class="lesson-count">${count} lessons</span>
      </div>
      <i class="fas fa-chevron-right topic-arrow"></i>
    </div>
  `;
}

function renderTopics() {
  const data = tutorialData;
  if (!data) return;

  let html = '';
  if (currentMode === 'main') html += renderBeginnerBanner();
  html += '<div class="topic-grid">';
  for (const [id, section] of Object.entries(data)) {
    html += renderTopicCard(id, section);
  }
  html += '</div>';
  contentContainer.innerHTML = html;
  backButtonContainer.innerHTML = '';
}

function openSection(sectionId) {
  if (tutorialData[sectionId]) {
    currentSection = sectionId;
    isLessonView = true;
    updateUrl({ mode: currentMode, section: sectionId });
    renderLessons(sectionId);
  }
}

function renderLessons(sectionId) {
  const section = tutorialData[sectionId];
  if (!section) return;

  backButtonContainer.innerHTML = `
    <button class="back-btn" onclick="goHome()">
      <i class="fas fa-arrow-left"></i> Back to Topics
    </button>
  `;

  const itemsHtml = section.items.map((item, idx) => renderItem(item, idx)).join('');
  const count = section.items.length;
  const html = `
    <div class="section-container">
      <div class="section-header">
        <div class="icon-wrap"><i class="fas ${section.icon}"></i></div>
        <h2>${escapeHtml(section.title)}</h2>
        <span class="count">${count} lessons</span>
      </div>
      <div class="commands-list">${itemsHtml}</div>
    </div>
  `;
  contentContainer.innerHTML = html;

  contentContainer.querySelectorAll('.copy-code-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const code = this.getAttribute('data-code');
      if (code) copyToClipboard(code);
    });
  });

  scrollToTop();
}

function renderItem(item, index) {
  const hasCode = item.code && item.code.trim();
  const highlighted = hasCode ? highlightCode(item.code) : '';
  const safeCode = item.code ? item.code.replace(/'/g, "\\'").replace(/"/g, '&quot;') : '';
  return `
    <div class="command-card expanded">
      <div class="command-header" onclick="toggleCommand(this)">
        <div class="command-title"><span class="num">${index + 1}</span><span>${escapeHtml(item.title)}</span></div>
        <i class="fas fa-chevron-down command-arrow"></i>
      </div>
      <div class="command-content">
        <p class="command-desc">${escapeHtml(item.description)}</p>
        ${hasCode ? `
          <div class="code-block">
            <div class="code-header"><span><i class="fas fa-terminal"></i> Terminal</span><button class="copy-code-btn" data-code="${safeCode}"><i class="fas fa-copy"></i> Copy</button></div>
            <pre><code>${highlighted}</code></pre>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

window.toggleCommand = function(header) {
  const card = header.closest('.command-card');
  card.classList.toggle('expanded');
};

window.openSection = openSection;
window.goHome = goHome;
window.scrollToTop = scrollToTop;

loadData();