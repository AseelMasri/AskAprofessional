const getTokenPayload = () => {
  const token = localStorage.getItem('token');
  if (!token || token.split('.').length !== 3) return null;

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch (err) {
    console.error('❌ خطأ في قراءة التوكن:', err);
    return null;
  }
};

const handleProfileLinkVisibility = () => {
  const payload = getTokenPayload();
  const link = document.getElementById('profileLink');
  if (!link) return;

  const usertype = payload?.usertype ? decodeURIComponent(escape(payload.usertype)) : '';

  if (payload && usertype === 'مهني' && payload.id) {
    const base = location.pathname.includes('/pages/') ? 'profile.html' : './pages/profile.html';
    link.href = `${base}?id=${payload.id}`;
    link.classList.remove('d-none');
    link.style.display = 'inline-flex';
  } else {
    link.classList.add('d-none');
  }
};

// شغّل الدالة عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
  handleProfileLinkVisibility();
});
