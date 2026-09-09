const defaultProjects = [
  { title: 'Library Management System', category: 'software', year: '2026', description: 'A system for organizing library books, members, borrowing, and returns in one place.', details: 'The Library Management System helps make everyday library operations easier to manage by keeping books, members, and lending activity organized.', tags: 'Web application · Database · Software engineering' }
];
const savedProjects = JSON.parse(localStorage.getItem('portfolioProjects') || 'null');
let projects = savedProjects || defaultProjects;

const defaultProfile = {
  name: 'Dzuvor Clement',
  role: 'Software engineer · security analyst · IoT builder',
  availability: 'Available for selected projects',
  bio: 'I turn complex problems into reliable digital products, blending full-stack engineering with a security-first point of view.',
  location: 'Based in Accra<br />Working globally',
  imageUrl: '',
  cvUrl: ''
};
const savedProfile = JSON.parse(localStorage.getItem('portfolioProfile') || 'null');
let profile = savedProfile ? { ...defaultProfile, ...savedProfile } : defaultProfile;
if (profile.name === 'Wonder Dogbe' || profile.name === 'Clement Dzuvor' || profile.name === 'Dzuvor Clement') {
  profile.name = 'Dzuvor Clement';
  localStorage.setItem('portfolioProfile', JSON.stringify(profile));
}
if (profile.role === 'Software engineer · security analyst') {
  profile.role = defaultProfile.role;
  localStorage.setItem('portfolioProfile', JSON.stringify(profile));
}

const list = document.querySelector('#projectList');
const filters = document.querySelector('#filters');
const dialog = document.querySelector('#projectDialog');
const dialogContent = document.querySelector('#dialogContent');
const themeToggle = document.querySelector('#themeToggle');
const menuToggle = document.querySelector('#menuToggle');
const mobileNav = document.querySelector('#mobileNav');

let categories = ['all', ...new Set(projects.map((project) => project.category))];
let activeCategory = 'all';

function renderProfile() {
  document.title = `${profile.name} | ${profile.role}`;
  document.querySelector('#footerName').textContent = profile.name;
  const portraitName = document.querySelector('#portraitName');
  if (portraitName) portraitName.textContent = profile.name;
  document.querySelector('#availabilityText').textContent = profile.availability;
  document.querySelector('#roleText').textContent = profile.role;
  document.querySelector('#bioText').textContent = profile.bio;
  document.querySelector('#locationText').innerHTML = profile.location;
  const portrait = document.querySelector('#portrait');
  portrait.innerHTML = profile.imageUrl ? '' : '<span>CD</span>';
  portrait.style.backgroundImage = profile.imageUrl ? `url("${profile.imageUrl}")` : '';
  portrait.classList.toggle('has-image', Boolean(profile.imageUrl));
  const cvLink = document.querySelector('#cvLink');
  cvLink.href = profile.cvUrl || '#contact';
  cvLink.target = profile.cvUrl ? '_blank' : '';
  cvLink.rel = profile.cvUrl ? 'noreferrer' : '';
  cvLink.innerHTML = profile.cvUrl ? 'Download full CV <span>↗</span>' : 'Add your CV <span>↗</span>';
}

function renderFilters() {
  filters.innerHTML = categories.map((category) => `<button class="filter ${category === activeCategory ? 'active' : ''}" data-category="${category}">${category}</button>`).join('');
  filters.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => {
    activeCategory = button.dataset.category;
    renderFilters();
    renderProjects();
  }));
}

function renderProjects() {
  const visibleProjects = activeCategory === 'all' ? projects : projects.filter((project) => project.category === activeCategory);
  list.innerHTML = visibleProjects.map((project) => `<article class="project-card" tabindex="0" data-project="${project.title}">
    <div><h3>${project.title}</h3><p>${project.description}</p></div>
    <div class="project-meta"><span>${project.category}</span><span>${project.year}</span><span class="project-arrow">↗</span></div>
  </article>`).join('');
  list.querySelectorAll('.project-card').forEach((card) => {
    card.addEventListener('click', () => openProject(card.dataset.project));
    card.addEventListener('keydown', (event) => { if (event.key === 'Enter') openProject(card.dataset.project); });
  });
}

function openProject(title) {
  const project = projects.find((item) => item.title === title);
  const projectLink = project.projectUrl || project.projectFile;
  const viewLink = projectLink ? `<a class="button button-primary project-view-link" href="${projectLink}" target="_blank" rel="noreferrer">View project <span>↗</span></a>` : '';
  dialogContent.innerHTML = `<span class="dialog-kicker">${project.category} · ${project.year}</span><h2>${project.title}</h2><p>${project.details}</p><p class="dialog-tags">${project.tags || ''}</p>${viewLink}`;
  dialog.showModal();
}

async function loadRemoteContent() {
  if (window.location.protocol === 'file:') return;
  const response = await fetch('api.php');
  if (!response.ok) throw new Error('Unable to load shared portfolio content');
  const content = await response.json();
  if (content.profile && Object.keys(content.profile).length) profile = { ...defaultProfile, ...content.profile };
  if (Array.isArray(content.projects) && content.projects.length) projects = content.projects;
  categories = ['all', ...new Set(projects.map((project) => project.category))];
}

const dialogClose = document.querySelector('#dialogClose');
if (dialog && dialogClose) {
  dialogClose.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
}

themeToggle.addEventListener('click', () => {
  const light = document.body.classList.toggle('light-mode');
  themeToggle.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
});

menuToggle.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', open);
});
mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => mobileNav.classList.remove('open')));

loadRemoteContent().finally(() => {
  renderProfile();
  renderFilters();
  renderProjects();
});
