function checkAuthAndRole() {
  // 1. Check sessionStorage first
  let user = null;
  const sessionUser = sessionStorage.getItem('user');
  
  if (sessionUser) {
    user = JSON.parse(sessionUser);
  } 
  // 2. If not in sessionStorage, check localStorage
  else {
    const rememberedSession = localStorage.getItem('rememberedSession');
    if (rememberedSession) {
      try {
        const sessionData = JSON.parse(rememberedSession);
        user = sessionData.user;
      } catch (e) {
        console.error("Failed to parse remembered session:", e);
      }
    }
  }

  // 3. If no user found, redirect to login
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  // 4. Check user role
  if (user.role !== 'admin') {
    window.location.href = 'index.html';
    return;
  }

  // 5. If everything is OK, continue loading the dashboard
  loadDashboard();
}

function loadDashboard() {
  // All your dashboard initialization code goes here
  console.log("Loading dashboard...");
  // Example:
  // fetchUserData();
  // renderDashboard();
  // setupEventListeners();
}
// Llamar al verificar al cargar la página
checkAuthAndRole();

function logout() {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('usuario');  
  localStorage.removeItem('rememberedSession');
  window.location.href = 'index.html';
}