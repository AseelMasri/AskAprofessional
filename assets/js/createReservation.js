//cteateReservation.js

// تنسيق التاريخ
const formatDate = (dateStr) => {
  const [year, month, day] = dateStr.split("-");
  return `${day}-${month}-${year}`;
};

// تحميل الأوقات المتاحة
const loadAvailableTimes = async (selectedDate) => {
  const profId = getProfessionalIdFromURL();
  if (!profId) return;

  const timeSelect = document.getElementById("time");

  try {
    const res = await axios.get(
      `https://askprof-gojl.onrender.com/ProfessionalProfile/getWorkingHours/${profId}`
    );

    const allWeeks = [
      ...(res.data.week1 || []),
      ...(res.data.week2 || []),
      ...(res.data.week3 || []),
      ...(res.data.week4 || [])
    ];

    const matchingSlots = allWeeks.filter(slot =>
      new Date(slot.date).toISOString().split('T')[0] === selectedDate &&
      slot.status === "متاح"
    );

    timeSelect.innerHTML = `<option selected disabled>اختر الوقت</option>`;

    if (matchingSlots.length) {
      matchingSlots.forEach(slot => {
        const option = document.createElement("option");
        option.value = `${slot.startTime}|${slot.endTime}`;
        option.textContent = `${slot.startTime} - ${slot.endTime}`;
        timeSelect.appendChild(option);
      });
    } else {
      const option = document.createElement("option");
      option.textContent = "لا يوجد مواعيد متاحة";
      option.disabled = true;
      timeSelect.appendChild(option);
    }

  } catch (err) {
    console.error("فشل في جلب الأوقات:", err);
  }
};

// عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
  const bookingSection = document.getElementById("booking-section");

  // إخفاء السكشن لو المستخدم هو المهني
  if (isProfessionalUser() || isProfileOwner()) {
    if (bookingSection) bookingSection.classList.add("d-none");
    return;
  }

  // عناصر النموذج
  const dateInput = document.getElementById("date");
  const timeSelect = document.getElementById("time");
  const subjectInput = document.getElementById("subject");
  const form = document.getElementById("bookingForm");

  // عند تغيير التاريخ
  dateInput?.addEventListener("change", () => {
    const selectedDate = dateInput.value;
    if (selectedDate) loadAvailableTimes(selectedDate);
  });

  // عند إرسال النموذج
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const date = dateInput.value;
    const timeValue = timeSelect.value;
    const subject = subjectInput.value.trim();
    const token = localStorage.getItem("token");
    const profId = getProfessionalIdFromURL();

    if (!token) {
      return Swal.fire("تنبيه", "يرجى تسجيل الدخول أولاً", "warning");
    }

    if (!date || !timeValue || !subject) {
      return Swal.fire("خطأ", "يرجى تعبئة جميع الحقول", "error");
    }

    const [startTime, endTime] = timeValue.split("|");

    try {
      await axios.post(
        `https://askprof-gojl.onrender.com/Booking/createBooking/${profId}`,
        {
          bookingDate: formatDate(date),
          startTime,
          endTime,
          bookingDetails: subject
        },
        {
          headers: { token }
        }
      );

      Swal.fire("تم الحجز بنجاح", "", "success");
      form.reset();
      timeSelect.innerHTML = `<option selected disabled>اختر الوقت</option>`;

      // تحديث جدول المواعيد
      const updatedData = await window.fetchWorkingHoursByWeeks(profId);

      const currentTab = document.querySelector(".breadcrumbs .current");
      const tabs = document.querySelectorAll(".breadcrumbs span");

    if (currentTab && tabs.length) {
  const index = Array.from(tabs).indexOf(currentTab);
  window.setupWeekTabs(updatedData);
  window.renderByTabIndex(index, updatedData);
}

    } catch (err) {
      console.error(err);
      Swal.fire("فشل الحجز", err.response?.data?.message || "حدث خطأ غير متوقع", "error");
    }
  });
});
