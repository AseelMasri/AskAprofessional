document.addEventListener("DOMContentLoaded", async () => {
  const container = document.querySelector(".chatListContainer");
  const token = localStorage.getItem("token");

  if (!token) {
    Swal.fire("الرجاء تسجيل الدخول", "", "info");
    return;
  }

  const parseTokenPayload = () => {
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

  try {
    const payload = parseTokenPayload();
    const usertype = payload?.usertype || payload?.role || '';
    const isProfessional = usertype === "مهني";

    console.log("نوع الحساب:", usertype);
    console.log("هل الحساب مهني؟", isProfessional);

    const res = await axios.get("https://askprof-gojl.onrender.com/chat/getconversations", {
      headers: { token },
    });

    const conversations = res.data || [];
    container.innerHTML = "";

    if (conversations.length === 0) {
      container.innerHTML = `<div class="text-center text-muted py-3">لا توجد محادثات حالياً.</div>`;
      return;
    }

    conversations.forEach((conv) => {
      const other = conv.otherParticipant;
      const name = other?.username || "مستخدم";

      let avatarHTML;
      if (other?.profilePicture) {
        avatarHTML = `
          <img src="${other.profilePicture}" class="rounded-circle contact-img"
               style="width: 45px; height: 45px; object-fit: cover;"
               onerror="this.onerror=null;this.src='../assets/images/default-user.jpg';" />`;
      } else {
        avatarHTML = `
          <div class="rounded-circle d-flex align-items-center justify-content-center contact-img"
               style="width: 45px; height: 45px;">
            <i class="fa-solid fa-user" style="color: #f7921e; font-size: 20px;"></i>
          </div>`;
      }

      const card = document.createElement("a");
      card.href = `../pages/professionalChat.html?conversationId=${conv._id}`;
      card.className = "chat-card";

      card.innerHTML = `
        <div class="d-flex align-items-center justify-content-between w-100">
          <div class="d-flex align-items-center gap-2">
            <div class="position-relative">
              ${avatarHTML}
              <span class="status-dot"></span>
            </div>
            <div class="text-start">
              <div class="contact-name">${name}</div>
              <div class="contact-role">عرض المحادثة</div>
            </div>
          </div>
          <span class="unread-badge d-none">0</span>
        </div>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.error("فشل تحميل المحادثات:", err);
    Swal.fire("خطأ", "فشل في تحميل المحادثات", "error");
  }
});


/*
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.querySelector(".chatListContainer");
  const token = localStorage.getItem("token");

  if (!token) {
    Swal.fire("الرجاء تسجيل الدخول", "", "info");
    return;
  }

  try {
    //  استخراج نوع المستخدم من التوكن
    const payload = JSON.parse(atob(token.split(".")[1]));
    const usertype = decodeURIComponent(escape(payload.usertype || payload.role || ''));
    const isProfessional = usertype === "مهني";

    console.log(" نوع الحساب:", usertype);
    console.log(" هل الحساب مهني؟", isProfessional);

    const res = await axios.get("https://askprof-gojl.onrender.com/chat/getconversations", {
      headers: { token },
    });

    const conversations = res.data || [];
    container.innerHTML = "";

    if (conversations.length === 0) {
      container.innerHTML = `<div class="text-center text-muted py-3">لا توجد محادثات حالياً.</div>`;
      return;
    }

    conversations.forEach((conv) => {
      const other = conv.otherParticipant;
      const name = other?.username || "مستخدم";

      //  الطرف الآخر دائمًا مهني، نعرض صورته إذا موجودة، وإلا فونت أوسم
      let avatarHTML;

      if (other?.profilePicture) {
        avatarHTML = `
          <img src="${other.profilePicture}" class="rounded-circle contact-img"
               style="width: 45px; height: 45px; object-fit: cover;"
               onerror="this.onerror=null;this.src='../assets/images/default-user.jpg';" />`;
      } else {
        avatarHTML = `
          <div class="rounded-circle d-flex align-items-center justify-content-center contact-img"
               style="width: 45px; height: 45px;">
            <i class="fa-solid fa-user" style="color: #f7921e; font-size: 20px;"></i>
          </div>`;
      }

      const card = document.createElement("a");
      card.href = `../pages/professionalChat.html?conversationId=${conv._id}`;
      card.className = "chat-card";

      card.innerHTML = `
        <div class="d-flex align-items-center justify-content-between w-100">
          <div class="d-flex align-items-center gap-2">
            <div class="position-relative">
              ${avatarHTML}
              <span class="status-dot"></span>
            </div>
            <div class="text-start">
              <div class="contact-name">${name}</div>
              <div class="contact-role">عرض المحادثة</div>
            </div>
          </div>
          <span class="unread-badge d-none">0</span>
        </div>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.error(" فشل تحميل المحادثات:", err);
    Swal.fire("خطأ", "فشل في تحميل المحادثات", "error");
  }
});
*/