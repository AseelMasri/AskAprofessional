//workingHours.js
const arabicDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

//  دالة تساعد على جلب فهرس التاب الحالي
const getCurrentTabIndex = () => {
  const currentTab = document.querySelector('.breadcrumbs .current');
  return [...document.querySelectorAll('.breadcrumbs span')].indexOf(currentTab);
};
const renderByTabIndex = (index, data) => {
  if (index === 0) renderWeek(data.week1);
  else if (index === 1) renderWeek(data.week2);
  else if (index === 2) renderWeek([
    ...data.week1,
    ...data.week2,
    ...data.week3,
    ...data.week4
  ]);
};

const fetchWorkingHoursByWeeks = async (id) => {
  try {
    const res = await axios.get(`https://askprof-gojl.onrender.com/ProfessionalProfile/getWorkingHours/${id}`);
    return res.data || {};
  } catch (err) {
    console.error("فشل في جلب المواعيد:", err);
    return {};
  }
};

const renderWeek = (appointments = []) => {
  const tbody = document.querySelector('.appointment table tbody');
  const thead = document.querySelector('.appointment table thead tr');
  tbody.innerHTML = '';

const isOwner = isProfileOwner();

  thead.innerHTML = `
    <th>التاريخ</th>
    <th>اليوم</th>
    <th>الوقت</th>
    <th>الحالة</th>
    <th>الحجز</th>
    ${isOwner ? '<th>حذف</th>' : ''}
  `;

  if (!appointments.length) {
    tbody.innerHTML = `<tr><td colspan="${isOwner ? 6 : 5}" class="text-center text-muted">لا توجد مواعيد لهذا الأسبوع</td></tr>`;
    return;
  }

  appointments.forEach(item => {
    const timeRange = `${item.startTime} - ${item.endTime}`;
    const statusClass = item.status === 'محجوز' ? 'status-booked' : 'status-available';
    const formattedDate = new Date(item.date).toLocaleDateString('ar-EG');

    const iconName = item.status === 'محجوز' ? 'lock' : 'book';
    const iconAlt = item.status === 'محجوز' ? 'محجوز' : 'متاح';
    const iconTitle = item.status === 'محجوز' ? 'هذا الموعد محجوز' : 'هذا الموعد متاح للحجز';

    const deleteBtn = isOwner
      ? `<button class="btn btn-sm btn-danger delete-hour-btn" data-id="${item._id}">حذف</button>`
      : '';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formattedDate}</td>
      <td>${item.day}</td>
      <td>${timeRange}</td>
      <td class="${statusClass}">${item.status}</td>
      <td>
        <img src="../assets/images/${iconName}.svg" alt="${iconAlt}" title="${iconTitle}" />
      </td>
      ${isOwner ? `<td>${deleteBtn}</td>` : ''}
    `;
    tbody.appendChild(tr);
  });

  if (isOwner) {
    setupDeleteButtons();
  }
};


const setupWeekTabs = (data) => {
  const tabs = document.querySelectorAll('.breadcrumbs span');
  tabs.forEach((tab, index) => {
    const newTab = tab.cloneNode(true); //  حذف أي مستمعات سابقة
    tab.replaceWith(newTab); //  استبدال العنصر القديم بالجديد النظيف

    newTab.addEventListener('click', () => {
      document.querySelectorAll('.breadcrumbs span').forEach(t => t.classList.remove('current'));
      newTab.classList.add('current');
      renderByTabIndex(index, data);


    });
  });
};


//تحديث حقل اليوم تلقائيًا بناءً على التاريخ
window.updateArabicDay = function (dateStr) {
  if (dateStr) {
    const dayName = arabicDays[new Date(dateStr).getDay()];
    document.getElementById('swal-day-display').value = dayName;
  }
};




const setupAddWorkingHourButton = () => {
  const addBtn = document.querySelector('.table-edit-btn');
  if (!addBtn) return;

  if (!isProfileOwner()) {
    addBtn.style.display = 'none';
    return;
  }

  addBtn.addEventListener('click', async () => {
    const { value: formValues } = await Swal.fire({
      title: 'إضافة موعد جديد',
      html: `
        <div style="display: flex; flex-direction: column; gap: 10px; text-align: right;">
          <label for="swal-date">التاريخ:</label>
          <input id="swal-date" type="date" class="swal2-input" onchange="updateArabicDay(this.value)">

          <label>اليوم:</label>
          <input id="swal-day-display" class="swal2-input" readonly style="background-color: #eee; cursor: default;" />

          <label>الوقت:</label>
          <label for="swal-start">من</label>
          <input id="swal-start" type="time" class="swal2-input">

          <label for="swal-end">إلى</label>
          <input id="swal-end" type="time" class="swal2-input">
        </div>
      `,
      focusConfirm: false,
      confirmButtonText: 'إضافة',
      cancelButtonText: 'إلغاء',
      showCancelButton: true,
      preConfirm: () => {
        const date = document.getElementById('swal-date').value;
        const startTime = document.getElementById('swal-start').value;
        const endTime = document.getElementById('swal-end').value;

        if (!date || !startTime || !endTime) {
          Swal.showValidationMessage('يرجى تعبئة جميع الحقول');
          return false;
        }

        if (startTime >= endTime) {
          Swal.showValidationMessage('وقت البداية يجب أن يكون قبل وقت النهاية');
          return false;
        }

        const jsDate = new Date(date);
        const day = arabicDays[jsDate.getDay()];

        return { day, date, startTime, endTime };
      }
    });

    if (formValues) {
      const token = localStorage.getItem('token');
      const currentUserId = getIdFromToken(); // ضروري نرجع نستخدمهم هنا
      const profileId = getProfessionalIdFromURL();

      try {
        await axios.post(
          `https://askprof-gojl.onrender.com/ProfessionalProfile/addWorkingHours/${currentUserId}`,
          { workingHours: [formValues] },
          { headers: { token } }
        );

        Swal.fire('تم!', 'تمت إضافة الموعد بنجاح', 'success');

        const newData = await fetchWorkingHoursByWeeks(profileId);
        const tabIndex = getCurrentTabIndex();


        setupWeekTabs(newData);
       renderByTabIndex(tabIndex, newData);

      } catch (err) {
        Swal.fire('خطأ', err.response?.data?.message || 'فشل في إضافة الموعد', 'error');
      }
    }
  });
};
/*
const setupDeleteButtons = () => {
  const buttons = document.querySelectorAll('.delete-hour-btn');
  const token = localStorage.getItem('token');

  buttons.forEach(button => {
    button.addEventListener('click', async () => {
      const id = button.getAttribute('data-id');

      const confirm = await Swal.fire({
        title: 'تأكيد الحذف',
        text: 'هل أنت متأكد أنك تريد حذف هذا الموعد؟',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، احذفه',
        cancelButtonText: 'إلغاء'
      });

      if (confirm.isConfirmed) {
        try {
          await axios.delete(
            `https://askprof-gojl.onrender.com/ProfessionalProfile/deleteWorkingHour/${id}`,
            { headers: { token } }
          );

          const row = button.closest('tr');
          if (row) row.remove();

          Swal.fire('تم!', 'تم حذف الموعد بنجاح', 'success');

        } catch (err) {
          Swal.fire('خطأ', err.response?.data?.message || 'فشل في حذف الموعد', 'error');
        }
      }
    });
  });
};
*/
const setupDeleteButtons = () => {
  const buttons = document.querySelectorAll('.delete-hour-btn');
  const token = localStorage.getItem('token');

  buttons.forEach(button => {
    button.addEventListener('click', async () => {
      const id = button.getAttribute('data-id');

      const confirm = await Swal.fire({
        title: 'تأكيد الحذف',
        text: 'هل أنت متأكد أنك تريد حذف هذا الموعد؟',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، احذفه',
        cancelButtonText: 'إلغاء'
      });

      if (!confirm.isConfirmed) return;

      try {
        await axios.delete(
          `https://askprof-gojl.onrender.com/ProfessionalProfile/deleteWorkingHour/${id}`,
          { headers: { token } }
        );

        // أعِد جلب المواعيد من الخادم
        const profileId = getProfessionalIdFromURL();
        const newData   = await fetchWorkingHoursByWeeks(profileId);

        //   أعِد تهيئة التبويبات (لأنّها تحتوي عدّاد المواعيد)
        setupWeekTabs(newData);

        //   أعِد رسم التبويب الذي يقف عليه المستخدم الآن
        const tabIndex = getCurrentTabIndex();
        renderByTabIndex(tabIndex, newData);

        Swal.fire('تم!', 'تم حذف الموعد بنجاح', 'success');
      } catch (err) {
        Swal.fire('خطأ', err.response?.data?.message || 'فشل في حذف الموعد', 'error');
      }
    });
  });
};

document.addEventListener('DOMContentLoaded', async () => {
  const id = getProfessionalIdFromURL();
  if (!id) return;

  const data = await fetchWorkingHoursByWeeks(id);
  if (!data.week1 || !Array.isArray(data.week1)) return;

  renderWeek(data.week1);
  setupWeekTabs(data);
  setupAddWorkingHourButton();
});

window.fetchWorkingHoursByWeeks = fetchWorkingHoursByWeeks;
window.renderWeek = renderWeek;
window.setupWeekTabs = setupWeekTabs;
window.renderByTabIndex = renderByTabIndex;

