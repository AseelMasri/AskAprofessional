//logout.js
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const dropdownMenu = document.getElementById("loginDropdownMenu");

  const payload = parseTokenPayload(); // ✅ من tokenUtils.js
  console.log("📦 محتوى التوكن:", payload);

  if (payload) {
    const username = payload.name || payload.username || "حسابي";

    loginBtn.textContent = username;
    loginBtn.classList.add("dropdown-toggle");
    loginBtn.setAttribute("data-bs-toggle", "dropdown");
    dropdownMenu.classList.remove("d-none");

    const logoutLink = document.getElementById("logoutLink");
    if (logoutLink) {
      logoutLink.addEventListener("click", (e) => {
        e.preventDefault();
        logout();
      });
    }
  } else {
    loginBtn.textContent = "تسجيل الدخول";
    loginBtn.classList.remove("dropdown-toggle");
    loginBtn.removeAttribute("data-bs-toggle");
    dropdownMenu.classList.add("d-none");

    loginBtn.addEventListener("click", () => {
      // 📝 حفظ الصفحة الحالية قبل الانتقال لصفحة تسجيل الدخول
      localStorage.setItem("redirectAfterLogin", location.pathname);

      // 🔁 التوجيه لصفحة تسجيل الدخول
      const loginPath = location.pathname.includes("/pages/")
        ? "login.html"
        : "./pages/login.html";
      window.location.href = loginPath;
    });
  }
});

function logout() {
  Swal.fire({
    title: "هل تريد تسجيل الخروج؟",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "نعم",
    cancelButtonText: "إلغاء"
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem("token");

      // ✅ تحقق إذا المستخدم في صفحة البروفايل
      const isProfilePage = window.location.pathname.includes("profile.html");

      if (isProfilePage) {
        window.location.href = "../pages/professional.html"; // أو المسار الصحيح حسب هيكل مجلداتك
      } else {
        window.location.reload(); // إعادة تحميل نفس الصفحة
      }
    }
  });
}
