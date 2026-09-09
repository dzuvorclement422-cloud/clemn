const apiUrl = 'api.php';
let content = { profile: {}, projects: [] };
const loginPanel = document.querySelector('#loginPanel');
const loginForm = document.querySelector('#loginForm');
const dashboard = document.querySelector('#dashboard');
const profileForm = document.querySelector('#profileForm');
const projectForm = document.querySelector('#projectForm');

function showStatus(id, message, error = false) {
  const status = document.querySelector(`#${id}`);
  status.textContent = message;
  status.style.color = error ? '#ff8e8e' : '';
}

function fillProfile() {
  Object.entries(content.profile).forEach(([key, value]) => {
    const field = profileForm.elements.namedItem(key);
    if (field) field.value = String(value).replace(/<br \/>/g, '\n');
  });
}

function renderProjects() {
  document.querySelector('#projectList').innerHTML = content.projects.map((project) => `<div class="admin-project"><strong>${project.title}</strong><span>${project.category} · ${project.year}</span></div>`).join('');
}

async function loadContent() {
  const response = await fetch(apiUrl);
  if (!response.ok) throw new Error('Could not load portfolio content');
  content = await response.json();
  fillProfile();
  renderProjects();
}

async function saveContent(statusId) {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(content)
  });
  if (!response.ok) throw new Error(response.status === 401 ? 'Your session has expired' : 'Save failed');
  showStatus(statusId, 'Saved');
}

async function uploadFile(file) {
  if (!file || !file.size) return '';
  const data = new FormData();
  data.append('file', file);
  const response = await fetch(apiUrl, { method: 'POST', body: data });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Upload failed');
  return result.url;
}

profileForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(profileForm);
  content.profile = Object.fromEntries(data.entries());
  content.profile.location = content.profile.location.replace(/\n/g, '<br />');
  try {
    content.profile.imageUrl = await uploadFile(data.get('imageFile')) || content.profile.imageUrl;
    content.profile.cvUrl = await uploadFile(data.get('cvFile')) || content.profile.cvUrl;
    delete content.profile.imageFile;
    delete content.profile.cvFile;
    await saveContent('profileStatus');
  } catch (error) { showStatus('profileStatus', error.message, true); }
});

projectForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(projectForm);
  const project = Object.fromEntries(data.entries());
  delete project.projectFile;
  try {
    project.projectFile = await uploadFile(data.get('projectFile'));
    project.category = data.get('category').trim().toLowerCase();
    content.projects.push(project);
    await saveContent('projectStatus');
    projectForm.reset();
    renderProjects();
  } catch (error) {
    showStatus('projectStatus', error.message, true);
  }
});

async function openDashboard() {
  loginPanel.hidden = true;
  dashboard.hidden = false;
  await loadContent();
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const credentials = Object.fromEntries(new FormData(loginForm).entries());
  const response = await fetch(`${apiUrl}?action=login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) });
  if (!response.ok) {
    showStatus('loginStatus', 'Invalid username or password', true);
    return;
  }
  loginForm.reset();
  await openDashboard();
});

document.querySelector('#logoutButton').addEventListener('click', async () => {
  await fetch(`${apiUrl}?action=logout`, { method: 'POST' });
  dashboard.hidden = true;
  loginPanel.hidden = false;
});

fetch(`${apiUrl}?action=session`).then((response) => response.json()).then((session) => {
  if (session.authenticated) openDashboard().catch((error) => showStatus('loginStatus', error.message, true));
});
