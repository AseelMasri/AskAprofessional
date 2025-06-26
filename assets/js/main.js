//main.js
document.addEventListener('DOMContentLoaded', async () => {
  handleProfileLinkVisibility();
   hideRateLinkIfProfessional();
  await loadGovernorates();
  setupReviewButton();
  handlePendingReview();
  await loadReviews();
  setupExploreButtons();
  setupChatRedirectButton();
  
  
});


//  تحميل المحافظات
const loadGovernorates = async () => {
  try {
    const response = await axios.get('https://askprof-gojl.onrender.com/governorate/getgovernorate');
    const governorates = response.data.governorates;
    const selectElement = document.querySelector('.governorates-select');
    governorates.forEach(gov => {
      const option = document.createElement('option');
      option.value = gov.name;
      option.textContent = gov.name;
      selectElement.appendChild(option);
    });
  } catch (error) {
    console.error('خطأ أثناء تحميل المحافظات:', error);
  }
};

//  زر فتح التقييم
const setupReviewButton = () => {
  const rateLink = document.getElementById('rateLink');
  if (!rateLink) return;

  rateLink.addEventListener('click', e => {
    e.preventDefault();

    Swal.fire({
      title: 'أدخل رأيك',
      html: `
        <input id="user-review" class="swal2-input" placeholder="اكتب رأيك هنا">
        <div id="star-rating" style="font-size: 1.5rem; color: #ccc;">
          ${[1, 2, 3, 4, 5].map(i => `<i class="fa fa-star" data-value="${i}"></i>`).join('')}
        </div>
      `,
      confirmButtonText: 'إرسال',
      preConfirm: async () => {
        const message = document.getElementById('user-review').value.trim();
        const rating = document.querySelectorAll('#star-rating .fa.selected').length;

        if (!message || rating < 1) {
          Swal.showValidationMessage('يرجى كتابة رأيك واختيار نجمة واحدة على الأقل');
          return false;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          localStorage.setItem('pendingReview', JSON.stringify({ comment: message, rating }));
          localStorage.setItem('redirectAfterLogin', window.location.href);

          Swal.fire({
            icon: 'warning',
            title: 'يرجى تسجيل الدخول أولاً',
            text: 'سيتم تحويلك لتسجيل الدخول ثم إرسال تقييمك تلقائيًا',
            timer: 2500,
            showConfirmButton: false,
            timerProgressBar: true,
            didClose: () => (window.location.href = './pages/login.html'),
          });

          return false;
        }

        await sendReview({ comment: message, rating });
        return false;
      }
    });

    setTimeout(() => {
      document.querySelectorAll('#star-rating .fa').forEach(star => {
        star.addEventListener('click', () => {
          const value = parseInt(star.getAttribute('data-value'));
          document.querySelectorAll('#star-rating .fa').forEach((s, i) => {
            s.classList.toggle('selected', i < value);
            s.style.color = i < value ? 'gold' : '#ccc';
          });
        });
      });
    }, 100);
  });
};

//  إرسال التقييم
const sendReview = async ({ comment, rating }) => {
  try {
    await axios.post('https://askprof-gojl.onrender.com/SiteReview/addSiteReview', {
      comment,
      rating
    }, {
      headers: { token: localStorage.getItem('token') }
    });

    Swal.fire({
      icon: 'success',
      title: 'تم إرسال التقييم',
      text: 'شكراً لمشاركتك',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    });

    const swiperInstance = document.querySelector('.swiper').swiper;

    if (swiperInstance.slides.length >= 15) {
      swiperInstance.removeSlide(0);
    }

    const username = getUsernameFromToken();

    const newSlide = document.createElement('div');
    newSlide.classList.add('swiper-slide');
    newSlide.innerHTML = `
      <div class="service-card w-100">
        <div class="clientInfo d-flex flex-column align-items-center gap-2">
          <i class="fa-solid fa-user text-color"></i>
          <span class="clientName">${username}</span>
        </div>
        <h5 class="fw-bold mt-4">
          ${[...Array(rating)].map(() => '<i class="fa fa-star text-warning"></i>').join('')}
        </h5>
        <p class="text-muted text-center fs-6 mt-4">${comment}</p>
      </div>
    `;

    swiperInstance.appendSlide(newSlide);
    swiperInstance.autoplay.start();
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'فشل الإرسال',
      text: error.response?.data?.message || 'حدث خطأ أثناء إرسال التقييم',
      showConfirmButton: false,
      timer: 2500
    });
  }
};

//  التحقق من تقييم مؤجل
const handlePendingReview = () => {
  setTimeout(async () => {
    const token = localStorage.getItem('token');
    const pending = localStorage.getItem('pendingReview');
    if (token && pending) {
      await sendReview(JSON.parse(pending));
      localStorage.removeItem('pendingReview');
    }
  }, 500);

  window.addEventListener('storage', async (e) => {
    if (e.key === 'token' && localStorage.getItem('pendingReview')) {
      await sendReview(JSON.parse(localStorage.getItem('pendingReview')));
      localStorage.removeItem('pendingReview');
    }
  });
};

//  تحميل التقييمات
const loadReviews = async () => {
  try {
    const reviewRes = await axios.get('https://askprof-gojl.onrender.com/SiteReview/getSiteReview');
    const reviews = reviewRes.data.reviews || [];
    const container = document.getElementById('reviewContainer');

    reviews.forEach(review => {
      const slide = document.createElement('div');
      slide.classList.add('swiper-slide');
      slide.innerHTML = `
        <div class="service-card w-100">
          <div class="clientInfo d-flex flex-column align-items-center gap-2">
            <i class="fa-solid fa-user text-color"></i>
            <span class="clientName">${review.user?.username || 'مستخدم'}</span>
          </div>
          <h5 class="fw-bold mt-4">
            ${[...Array(review.rating)].map(() => '<i class="fa fa-star text-warning"></i>').join('')}
          </h5>
          <p class="text-muted text-center fs-6 mt-4">${review.comment}</p>
        </div>
      `;
      container.appendChild(slide);
    });

    new Swiper('.Clients .swiper', {
      loop: false,
      slidesPerView: 3,
      slidesPerGroup: 3,
      spaceBetween: 20,
      watchOverflow: true,
      simulateTouch: true,
      autoplay: {
        delay: 3000,
        disableOnInteraction: false
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev'
      },
      breakpoints: {
        0: { slidesPerView: 1, slidesPerGroup: 1 },
        768: { slidesPerView: 2, slidesPerGroup: 2 },
        1024: { slidesPerView: 3, slidesPerGroup: 3 }
      }
    });

  } catch (error) {
    console.error('فشل تحميل التقييمات:', error);
  }
};
//  ربط أزرار "استكشف" في الصفحة الرئيسية
const setupExploreButtons = () => {
  document.querySelectorAll('.btn-explore').forEach(btn =>
    btn.addEventListener('click', e => {
      e.preventDefault(); // منع الانتقال الفوري
      const selectedGovernorate = document.querySelector('.governorates-select')?.value;
      const field = e.target.dataset.field;

      if (!selectedGovernorate || selectedGovernorate === 'اختر منطقتك') {
        return Swal.fire({
          icon: 'warning',
          title: 'يرجى اختيار المنطقة أولًا',
          confirmButtonText: 'حسنًا'
        });
      }

      const url = `./pages/professional.html?governorateName=${encodeURIComponent(selectedGovernorate)}&professionField=${encodeURIComponent(field)}`;
      window.location.href = url;
    })
  );
};

const redirectToProfile = () => {
  //const payload = getTokenPayload();
   const payload = parseTokenPayload();

  if (!payload) {
    alert('❌ يجب تسجيل الدخول للوصول إلى الملف الشخصي.');
    return;
  }

  if (payload.usertype === 'مهني' && payload.id) {
    window.location.href = `./pages/profile.html?id=${payload.id}`;
  } else {
    alert('❌ هذا الخيار متاح فقط للمستخدم المهني.');
  }
};
/*
const handleProfileLinkVisibility = () => {
  //const payload = getTokenPayload();
   const payload = parseTokenPayload();
  const link = document.getElementById('profileLink');

  if (!link) return;

  const usertype = payload?.usertype ? decodeURIComponent(escape(payload.usertype)) : '';

  if (payload && usertype === 'مهني' && payload.id) {
    // ✅ تحديد المسار الصحيح حسب مكان الصفحة
    const base = location.pathname.includes('/pages/') ? 'profile.html' : './pages/profile.html';
    link.href = `${base}?id=${payload.id}`;
    link.classList.remove('d-none');
    link.style.display = 'inline-flex';
  } else {
    link.classList.add('d-none');
  }
};
*/
const handleProfileLinkVisibility = () => {
  const payload = parseTokenPayload();
  const link = document.getElementById('profileLink');

  if (!link || !payload) return;

  const usertype = payload?.usertype || '';

  if (usertype === 'مهني' && payload.id) {
    const base = location.pathname.includes('/pages/') ? 'profile.html' : './pages/profile.html';
    link.href = `${base}?id=${payload.id}`;
    link.classList.remove('d-none');
    link.style.display = 'inline-flex';
  } else {
    link.classList.add('d-none');
  }
};
/*
const hideRateLinkIfProfessional = () => {
  //const payload = getTokenPayload();
   const payload = parseTokenPayload();
  const rateLink = document.getElementById("rateLink");

  if (!rateLink || !payload) return;

  const usertype = decodeURIComponent(escape(payload.usertype || ''));

  if (usertype === "مهني") {
    rateLink.classList.add("d-none");
  }
};
*/
const hideRateLinkIfProfessional = () => {
  const payload = parseTokenPayload();
  const rateLink = document.getElementById("rateLink");

  if (!rateLink || !payload) return;

  const usertype = payload?.usertype || '';

  if (usertype === "مهني") {
    rateLink.classList.add("d-none");
  }
};


const setupChatRedirectButton = () => {
  const chatBtn = document.getElementById("goToChatList");
  if (!chatBtn) return;

  chatBtn.addEventListener("click", () => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire("يرجى تسجيل الدخول", "", "info");
      return;
    }

    //const payload = getTokenPayload();
     const payload = parseTokenPayload();
    if (!payload) {
      Swal.fire("حدث خطأ", "تعذر قراءة معلومات الحساب", "error");
      return;
    }

    const userId = payload.id;
    const rawUsertype = payload.usertype || '';
    const decodedType = decodeURIComponent(escape(rawUsertype));
    const userModel = decodedType === "مهني" ? "Professional" : "User";

    console.log("📄 محتوى التوكن:", payload);
    console.log("✅ usertype المفكوك:", decodedType);
    console.log("➡️ فتح:", `./pages/chats.html?userId=${userId}&userModel=${userModel}`);

    window.location.href = `./pages/chats.html?userId=${userId}&userModel=${userModel}`;
  });
};
