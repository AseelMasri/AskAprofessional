// أدوات مساعدة
/*
const getTokenPayload = () => {
  const token = localStorage.getItem('token');

  // تحقق أولي من التوكن
  if (!token || token.split('.').length !== 3) {
    console.warn('التوكن غير صالح أو مفقود');
    return null;
  }

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    return JSON.parse(decoded);
  } catch (err) {
    console.error(' خطأ في فك التوكن:', err);
    return null;
  }
};
*/
const handleProfileLinkVisibility = () => {
  const link = document.getElementById('profileLink');
  if (!link) return;
  const payload = parseTokenPayload();

  //const payload = getTokenPayload();
  console.log("Payload:", payload);

  if (!payload || !payload.id) return;

  const rawType = payload.usertype || payload.userModel || '';
  const decodedType = decodeURIComponent(escape(rawType));
  console.log("👤 Decoded usertype:", decodedType);

  if (decodedType === 'مهني') {
    const base = location.pathname.includes('/pages/') ? 'profile.html' : './pages/profile.html';
    link.href = `${base}?id=${payload.id}`;
    link.classList.remove('d-none');
    link.style.display = 'inline-flex';
  } else {
    link.classList.add('d-none');
  }
};

const handleGoToProfessionalsBtn = () => {
  const payload = parseTokenPayload();

  //const payload = getTokenPayload();
  const btn = document.getElementById("goToProfessionalsBtn");

  if (!btn || !payload) return;

  const usertype = decodeURIComponent(escape(payload.usertype || ''));
  console.log("👤 نوع المستخدم:", usertype);

  if (usertype === 'مستخدم') {
    btn.classList.remove("d-none");
    btn.style.display = 'inline-block'; // تأكيد الظهور
  } else {
    btn.classList.add("d-none");
  }
};


const getBookingName = (booking) => booking.professionalName || booking.userName || 'غير معروف';
const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('ar-EG');

//  جلب الحجوزات
const fetchBookings = async (token) => {
  try {
    const res = await axios.get('https://askprof-gojl.onrender.com/Booking/getBookings', {
      headers: { token }
    });
    return res.data.bookings || [];
  } catch (err) {
    console.error(' فشل في جلب البيانات:', err);
    return [];
  }
};

const fetchDeletedBookings = async (token) => {
  try {
    const res = await axios.get('https://askprof-gojl.onrender.com/Booking/getDeletedBookings', {
      headers: { token }
    });
    return res.data.deletedBookings || [];
  } catch (err) {
    console.error(' فشل في جلب الحجوزات المحذوفة:', err);
    return [];
  }
};

// عرض الحجوزات
const renderActiveBookings = (bookings, userType) => {
  const container = document.getElementById('activeBookingsContainer');
  if (!container) return;

  if (bookings.length === 0) {
    container.innerHTML = '<p class="text-center">لا توجد حجوزات نشطة حالياً.</p>';
    return;
  }

  window._activeBookingsList = bookings;

  container.innerHTML = bookings.map((b, i) => {
    const name = getBookingName(b);
    const profession = b.professionField || 'مستخدم';
    const date = formatDate(b.bookingDate);
    /*const time = b.bookingTime || '--:--';*/
    const time = b.time || '--:--';


    return `
      <div class="booking-card text-center p-3">
        <i class="fa-solid fa-user text-color mb-2"></i>
        <p class="mb-1 text-muted">${profession}</p>
        <h5 class="fw-bold mb-1">${name}</h5>
        <p class="mb-1">${date}</p>
        <p class="mb-1">${time}</p>
        <div class="d-flex justify-content-center gap-2 mt-2">
        <button class="btn  text-white px-2 py-1 btn-sm rounded details-btn" onclick="viewDetails(${i})">عرض</button>
        <button class="btn btn-outline-danger px-2 py-1 btn-sm rounded" onclick="cancelBooking('${b.bookingId}')">إلغاء</button>
        </div>

      </div>
    `;
  }).join('');
};

const renderDeletedBookings = (bookings, userType) => {
  const container = document.getElementById('cancelledBookingsContainer');
  if (!container) return;

  if (bookings.length === 0) {
    container.innerHTML = '<p class="text-center">لا توجد حجوزات محذوفة.</p>';
    return;
  }

  container.innerHTML = bookings.map(b => {
    const name = getBookingName(b);
    const reason = b.cancellationReason || 'بدون سبب';
    const date = formatDate(b.bookingDate);

    return `
      <div class="d-flex align-items-start mb-3 gap-3 justify-content-between">
        <div class="d-flex align-items-center gap-2">
          <img src="../assets/images/reservationProfile.png" alt="صورة المستخدم" />
          <div class="d-flex flex-column gap-1">
            <span class="fw-bold">${name}</span>
            <span class="text-muted small">القسم: ${b.professionField || '---'}</span>
            <span class="cancelled-reason small reason">${reason}</span>
            <span class="text-muted small"> ${date}</span>
            
            

          </div>
        </div>
        <i class="fa-solid fa-trash"></i>
      </div>
    `;
  }).join('');
};

const viewDetails = (index) => {
  if (!window._activeBookingsList || !window._activeBookingsList[index]) return;
  const b = window._activeBookingsList[index];

  Swal.fire({
    title: 'تفاصيل الحجز',
    html: `
      <p><strong>الاسم:</strong> ${getBookingName(b)}</p>
      <p><strong>التخصص:</strong> ${b.professionField || '-'}</p>
      <p><strong>المحافظة:</strong> ${b.governorate || '-'}</p>
      <p><strong>تاريخ الحجز:</strong> ${formatDate(b.bookingDate)}</p>
      <p><strong>الوقت:</strong> ${b.time || '--:--'}</p>
      <p><strong>تفاصيل الحجز:</strong> ${b.bookingDetails || '-'}</p>
    `,
    confirmButtonText: 'إغلاق'
  });
};

const cancelBooking = async (bookingId) => {
  const result = await Swal.fire({
    title: 'هل أنت متأكد؟',
    input: 'text',
    inputLabel: 'سبب الإلغاء',
    inputPlaceholder: 'اكتب سبب الإلغاء هنا...',
    showCancelButton: true,
    confirmButtonText: 'نعم، إلغاء',
    cancelButtonText: 'لا',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    inputValidator: (value) => !value && 'الرجاء إدخال سبب الإلغاء'
  });

  if (result.isConfirmed) {
    const token = localStorage.getItem('token');
    const reason = result.value;

    try {
      const res = await axios.delete(`https://askprof-gojl.onrender.com/Booking/cancelBooking/${bookingId}`, {
        headers: { 'Content-Type': 'application/json', token },
        data: { cancellationReason: reason }
      });

      Swal.fire({ icon: 'success', title: 'تم الإلغاء', text: res.data.message || 'تم إلغاء الحجز بنجاح' })
        .then(refreshAllBookings);
    } catch (err) {
      console.error('فشل في الإلغاء:', err);
      const msg = err?.response?.data?.message || 'حدث خطأ أثناء محاولة الإلغاء. حاول مرة أخرى.';
      Swal.fire({ icon: 'error', title: 'فشل في الإلغاء', text: msg });
    }
  }
};

const refreshAllBookings = async () => {
  const token = localStorage.getItem('token');
  const payload = parseTokenPayload();

  //const payload = getTokenPayload();
  if (!token || !payload) return;

  const { usertype } = payload;
  
  const [activeBookings, deletedBookings] = await Promise.all([
    fetchBookings(token),
    fetchDeletedBookings(token)
  ]);

  renderActiveBookings(activeBookings, usertype);
  renderDeletedBookings(deletedBookings, usertype);
};

//document.addEventListener('DOMContentLoaded', refreshAllBookings);
document.addEventListener('DOMContentLoaded', async () => {
  handleProfileLinkVisibility(); 
  handleGoToProfessionalsBtn();

  Swal.fire({
    title: 'جاري تحميل الحجوزات...',
    text: 'يرجى الانتظار قليلاً.',
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  await refreshAllBookings(); // جلب الحجوزات
  Swal.close();
});




