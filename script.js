let tutorialData = {};
let currentMode = 'main';
let currentSection = null;
let isLessonView = false;

function renderApp() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <nav class="navbar">
      <div class="navbar-left" onclick="goHome()">
        <img src="favicon.svg" alt="Termux" class="navbar-logo">
        <span class="navbar-title">Termux <span class="highlight">Mastery</span></span>
      </div>
      <div class="navbar-right">
        <a href="https://github.com/incognito-dev07/termux-mastery" target="_blank" aria-label="GitHub Repository">
          <i class="fab fa-github"></i>
        </a>
      </div>
    </nav>
    <div class="app">
      <div id="backButtonContainer"></div>
      <main class="main">
        <div class="container"><div id="contentContainer"></div></div>
      </main>
      <footer class="footer">
        <p>Download Termux on <a href="https://f-droid.org/en/packages/com.termux/" target="_blank">F-Droid</a> · <a href="https://github.com/termux/termux-app" target="_blank">GitHub</a></p>
      </footer>
    </div>
    <div class="floating-nav" id="floatingNav">
      <button id="navMain" class="active"><i class="fas fa-book"></i> Main</button>
      <button id="navBeginner"><i class="fas fa-graduation-cap"></i> Beginner</button>
      <button class="scroll-btn" onclick="scrollToTop()"><i class="fas fa-arrow-up"></i></button>
    </div>
  `;
  
  contentContainer = document.getElementById('contentContainer');
  backButtonContainer = document.getElementById('backButtonContainer');
  copyToast = document.getElementById('copyToast');
  navBeginner = document.getElementById('navBeginner');
  navMain = document.getElementById('navMain');
  
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
}

let contentContainer, backButtonContainer, copyToast, navBeginner, navMain;

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
  
  let result = text.replace(/\{\{command\}\}/g, '<span class="cmd-highlight">');
  result = result.replace(/\{\{\/command\}\}/g, '</span>');
  
  const placeholders = [];
  result = result.replace(/<span class="cmd-highlight">.*?<\/span>/g, function(match) {
    placeholders.push(match);
    return '%%%PLACEHOLDER%%%';
  });
  
  result = escapeHtml(result);
  
  placeholders.forEach(function(placeholder, index) {
    result = result.replace('%%%PLACEHOLDER%%%', placeholder);
  });
  
  return result;
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
window.goHome = goHome;

function updateNav() {
  if (currentMode === 'main') { navMain.classList.add('active'); navBeginner.classList.remove('active'); }
  else { navBeginner.classList.add('active'); navMain.classList.remove('active'); }
}

function renderBeginnerBanner() {
  return `
    <div class="section-container" id="section-beginner-guide" style="margin-bottom:12px;">
      <div class="section-header">
        <div class="icon-wrap"><i class="fas fa-rocket"></i></div>
        <h2>Start Here — Beginner Track</h2>
        <span class="count">4 lessons</span>
      </div>
      <div style="padding:16px 20px 20px;">
        <p style="color:var(--text-secondary);margin-bottom:14px;font-size:14px;line-height:1.7;">Never used a terminal? This track walks you through the basics without any prior knowledge.</p>
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
window.openSection = openSection;

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
  const hasExample = item.example && item.example.trim();
  
  let contentHtml = '';
  
  if (item.content) {
    const paragraphs = item.content.split('\n\n');
    paragraphs.forEach(p => {
      if (p.trim()) {
        contentHtml += `<p class="command-desc">${highlightCommands(p.trim())}</p>`;
      }
    });
  }
  
  if (hasExample) {
    const exampleLines = item.example.split('\n').filter(line => line.trim());
    const formattedExample = exampleLines.map(line => {
      return highlightCommands(line.trim());
    }).join('<br>');
    
    contentHtml += `
      <div class="example-box">
        <h4><i class="fas fa-code"></i> Example</h4>
        <p>${formattedExample}</p>
      </div>
    `;
  }
  
  if (hasExercise) {
    contentHtml += `
      <div class="exercise-box">
        <h4><i class="fas fa-pencil-alt"></i> Exercise</h4>
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

function toggleCommand(header) {
  const card = header.closest('.command-card');
  card.classList.toggle('expanded');
}
window.toggleCommand = toggleCommand;

renderApp();
loadData();