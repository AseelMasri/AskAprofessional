//tokenUtils.js

// ✅ جلب الـ payload من التوكن
const parseTokenPayload = () => {
  const token = localStorage.getItem("token");
  if (!token || token.split(".").length !== 3) return null;

  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("فشل فك التوكن:", e);
    return null;
  }
};

// ✅ جلب اسم المستخدم من التوكن
const getUsernameFromToken = () => {
  const payload = parseTokenPayload();
  return payload?.username || payload?.name || payload?.user?.username || "مستخدم";
};

// ✅ جلب ID المستخدم من التوكن
const getIdFromToken = () => {
  const payload = parseTokenPayload();
  return payload?.id || payload?._id || null;
};

// ✅ جلب ID المهني من الرابط
const getProfessionalIdFromURL = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
};

// ✅ التحقق إذا المستخدم هو صاحب الملف
const isProfileOwner = () => {
  const userId = getIdFromToken();
  const profileId = getProfessionalIdFromURL();
  return userId && profileId && userId === profileId;
};

// ✅ التحقق إذا المستخدم مهني
const isProfessionalUser = () => {
  const payload = parseTokenPayload();
  const usertype = (payload?.usertype || payload?.role || "").trim();
  return usertype === "مهني";
};
// ✅ إرجاع نوع الحساب كنص: "Professional" أو "User"
const getModelFromToken = () => {
  const payload = parseTokenPayload();
  const usertype = (payload?.usertype || payload?.role || "").trim();
  return usertype === "مهني" ? "Professional" : "User";
};
