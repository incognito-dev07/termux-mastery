let tutorialData = {};
let currentMode = 'main';
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
    const mode = getUrlParam('mode') || 'main';
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

function highlightCommands(text) {
  if (!text) return '';
  let escaped = escapeHtml(text);
  // Highlight commands like pkg, ls, cd, etc.
  const cmdRegex = /\b(pkg|apt|ls|cd|pwd|mkdir|touch|cat|cp|mv|rm|echo|nano|vim|git|ssh|wget|curl|python|node|npm|pip|termux-setup-storage|termux-change-repo|chsh|source|history|man|ping|ifconfig|ip|scp|rsync|nmap|traceroute|dig|nslookup|vncserver|sshd|passwd|whoami|head|tail|less|tree|htop|grep|find|chmod|chown|kill|ps|top|df|du|tar|gzip|unzip|make|gcc|clang|java|ruby|perl|go|rustc|swiftc|deno|bun|yarn|pnpm|composer|pip3|virtualenv|conda|jupyter|flask|django|express|react|vue|angular|next|nuxt|svelte|astro|solid|qwik|remix|gatsby|eleventy|hugo|jekyll|hexo|vitepress|docsify|mkdocs|sphinx|pandoc|latex|pdflatex|bibtex|makeindex|tex|dotnet|mono|fsharp|haskell|ghc|erlang|elixir|mix|rebar|phoenix|laravel|symfony|rails|sidekiq|puma|unicorn|nginx|apache|caddy|traefik|envoy|haproxy|keepalived|pacemaker|corosync|docker|podman|buildah|skopeo|kubectl|helm|istio|linkerd|consul|vault|nomad|terraform|packer|vagrant|ansible|puppet|chef|salt|stackstorm|nagios|prometheus|grafana|zabbix|elk|elasticsearch|logstash|kibana|filebeat|metricbeat|auditbeat|heartbeat|packetbeat|journalctl|systemctl|service|chkconfig|update-rc.d|rc-update|sysctl|modprobe|insmod|rmmod|lsmod|dmesg|fdisk|mkfs|mount|umount|blkid|lsblk|parted|gparted|resize2fs|xfs_growfs|xfs_info|lvm|pvcreate|vgcreate|lvcreate|vgextend|lvextend|lvreduce|pvmove|vgreduce|lvremove|pvremove|vgremove|lvdisplay|pvdisplay|vgdisplay)\b/g;
  escaped = escaped.replace(cmdRegex, '<span class="cmd-highlight">$1</span>');
  // Highlight flags like -l, --help
  escaped = escaped.replace(/\b(-[a-zA-Z]|--[a-zA-Z-]+)\b/g, '<span class="cmd-highlight">$1</span>');
  return escaped;
}

function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

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
  if (currentMode === 'main') { navMain.classList.add('active'); navBeginner.classList.remove('active'); }
  else { navBeginner.classList.add('active'); navMain.classList.remove('active'); }
}

navMain.addEventListener('click', function() {
  if (currentMode === 'main') return;
  currentMode = 'main';
  currentSection = null;
  isLessonView = false;
  updateUrl({ mode: 'main', section: null });
  updateNav();
  loadData();
});

navBeginner.addEventListener('click', function() {
  if (currentMode === 'beginner') return;
  currentMode = 'beginner';
  currentSection = null;
  isLessonView = false;
  updateUrl({ mode: 'beginner', section: null });
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
        <button class="goto-beginner-btn" onclick="switchToBeginner()">
          <span><i class="fas fa-arrow-right"></i> Launch Beginner Course</span>
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  `;
}

function switchToBeginner() {
  currentMode = 'beginner';
  currentSection = null;
  isLessonView = false;
  updateUrl({ mode: 'beginner', section: null });
  updateNav();
  loadData();
}
window.switchToBeginner = switchToBeginner;

function renderTopicCard(id, section) {
  const count = section.items.length;
  const description = section.description || `${count} lessons to master this topic`;
  return `
    <div class="topic-card" onclick="openSection('${id}')">
      <div class="top-row">
        <div class="topic-icon"><i class="fas ${section.icon}"></i></div>
        <div class="title-row">
          <h3>${escapeHtml(section.title)}</h3>
          <span class="lesson-count">${count} lessons</span>
        </div>
        <i class="fas fa-chevron-right topic-arrow"></i>
      </div>
      <div class="description">${escapeHtml(description)}</div>
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
  scrollToTop();
}

function renderItem(item, index) {
  const hasExercise = item.exercise && item.exercise.trim();
  
  let contentHtml = '';
  
  // Content (lesson explanation)
  if (item.content) {
    const paragraphs = item.content.split('\n\n');
    paragraphs.forEach(p => {
      if (p.trim()) {
        contentHtml += `<p class="command-desc">${highlightCommands(p.trim())}</p>`;
      }
    });
  }
  
  // Exercise
  if (hasExercise) {
    contentHtml += `
      <div class="exercise-box">
        <h4><i class="fas fa-pencil-alt"></i> Try It Yourself</h4>
        <p>${escapeHtml(item.exercise)}</p>
      </div>
    `;
  }
  
  return `
    <div class="command-card expanded">
      <div class="command-header" onclick="toggleCommand(this)">
        <div class="command-title"><span class="num">${index + 1}</span><span>${escapeHtml(item.title)}</span></div>
        <i class="fas fa-chevron-down command-arrow"></i>
      </div>
      <div class="command-content">${contentHtml}</div>
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