const routes = {
  '/':              () => import('./panels/landing.js'),
  '/attendee':      () => import('./panels/attendee/index.js'),
  '/staff-login':   () => import('./panels/staff/login.js'),
  '/staff':         () => import('./panels/staff/dashboard.js'),
  '/control-login': () => import('./panels/control/login.js'),
  '/control':       () => import('./panels/control/dashboard.js'),
};

let currentUnmount = null;

export async function navigate(path) {
  if (currentUnmount) { try { currentUnmount(); } catch(e){} }
  window.history.pushState({}, '', path);
  await renderCurrentRoute();
}

async function renderCurrentRoute() {
  const path = window.location.pathname;
  const loader = routes[path] || routes['/'];
  const app = document.getElementById('app');
  app.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;"><div style="width:32px;height:32px;border:2px solid rgba(0,196,154,0.2);border-top-color:#00C49A;border-radius:50%;animation:spin 0.8s linear infinite;"></div></div>';

  const mod = await loader();
  
  // Auth guards
  if (path === '/staff' || path === '/control') {
    const { getCurrentUser, isStaffUser, isControlUser } = await import('./auth.js');
    const user = await getCurrentUser();
    if (!user) {
      navigate(path === '/staff' ? '/staff-login' : '/control-login');
      return;
    }
    if (path === '/staff' && !isStaffUser(user)) {
      navigate('/staff-login'); return;
    }
    if (path === '/control' && !isControlUser(user)) {
      navigate('/control-login'); return;
    }
  }
  
  app.innerHTML = mod.render();
  if (mod.init) currentUnmount = await mod.init(navigate) || null;
}

export function initRouter() {
  window.addEventListener('popstate', renderCurrentRoute);
  renderCurrentRoute();
}
