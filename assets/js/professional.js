
//  جلب التخصصات (Mock API)
const fetchSpecialties = () => {
  return Promise.resolve([
    'التكنولوجيا',
    'الكهربائيات',
    'ورشات البناء'
  ]);
};

//  جلب التقييمات (Mock API)
const fetchRatings = () => {
  return Promise.resolve([5, 4, 3, 2, 1]);
};

//  جلب المحافظات من API
const fetchGovernorates = async () => {
  try {
    const res = await axios.get('https://askprof-gojl.onrender.com/governorate/getgovernorate');
    return res.data.governorates || [];
  } catch (error) {
    console.error('❌ خطأ أثناء جلب المحافظات:', error);
    return [];
  }
};

//  تعبئة قائمة التخصصات
const populateSpecialtySelect = async (selectElement) => {
  try {
    const specialties = await fetchSpecialties();
    specialties.forEach((specialty) => {
      const trimmed = specialty.trim();
      const option = document.createElement('option');
      option.value = trimmed;
      option.textContent = trimmed;
      selectElement.appendChild(option);
    });
  } catch (error) {
    console.error('❌ خطأ أثناء تحميل التخصصات:', error);
  }
};

//  تعبئة قائمة التقييمات
const populateRatingSelect = async (selectElement) => {
  try {
    const ratings = await fetchRatings();
    ratings.forEach((rate) => {
      const option = document.createElement('option');
      option.value = rate;
      let stars = '';
      for (let i = 0; i < rate; i++) {
        stars += '★';
      }
      option.textContent = `${rate} ${stars}`;
      selectElement.appendChild(option);
    });
  } catch (error) {
    console.error('❌ خطأ أثناء تحميل التقييمات:', error);
  }
};

//  تعبئة قائمة المحافظات
const populateGovernorateSelect = async (selectElement) => {
  try {
    const governorates = await fetchGovernorates();
    governorates.forEach((gov) => {
      const trimmed = gov.name.trim();
      const option = document.createElement('option');
      option.value = trimmed;
      option.textContent = trimmed;
      selectElement.appendChild(option);
    });
  } catch (error) {
    console.error('❌ خطأ أثناء تحميل المحافظات:', error);
  }
};

//  عرض البطاقات
const renderProfessionalCards = (professionals) => {
  const container = document.getElementById('professionalsContainer');
  container.innerHTML = '';

  if (professionals.length === 0) {
    container.innerHTML = '<p class="text-center text-muted">لا يوجد مهنيين مطابقين.</p>';
    return;
  }

  professionals.forEach((pro) => {
     console.log('بيانات المهني:', pro); //  اضف هذا السطر هنا
    const col = document.createElement('div');
    col.className = 'col';
    col.innerHTML = `
      <div class="card prof-card text-center p-3 rounded-4 border-0">
        <i class="fas fa-user text-warning mb-2 fs-4"></i>
        <p class="mb-1 text-muted small">مهني . ${pro.professionField || 'تخصص غير معروف'}</p>
        <p class="fw-bold mb-1">${pro.username || 'اسم غير معروف'}</p>
        <p class="text-muted small mb-1">${pro.rating || 0} ★ · ${pro.governorate || ''}</p>
        <div class="d-flex justify-content-center gap-2 mt-2">
        <a 
        href="../pages/profile.html?id=${pro._id}" 
        class="btn btn-outline-warning btn-sm text-warning bg-white">
        عرض الملف
      </a>
       <a href="../pages/professionalChat.html?professionalId=${pro._id}" class="btn btn-warning btn-sm text-white">مراسلة</a>
        </div>
      </div>
    `;
    container.appendChild(col);
  });
};

//  فلترة المهنيين عند الضغط على زر "تطبيق الفلاتر"
const applyFilters = async () => {
  const specialty = document.getElementById('specialtySelect')?.value.trim();
  const ratingValue = document.getElementById('ratingSelect')?.value;
  const governorate = document.getElementById('governorate')?.value.trim();

 /* if (!specialty || !governorate) {
    return Swal.fire({
      icon: 'warning',
      title: 'يرجى اختيار كل من القسم والمنطقة الجغرافية'
    });
  }
*/
if (!specialty && !governorate) {
  return Swal.fire({
    icon: 'warning',
    title: 'يرجى اختيار كل من القسم والمنطقة الجغرافية'
  });
}

if (!specialty) {
  return Swal.fire({
    icon: 'warning',
    title: 'يرجى اختيار القسم'
  });
}

if (!governorate) {
  return Swal.fire({
    icon: 'warning',
    title: 'يرجى اختيار المنطقة الجغرافية'
  });
}

  const params = {
    governorateName: governorate,
    professionField: specialty
  };
  if (ratingValue) params.targetRating = ratingValue;

  //  تحديث الرابط بعد اختيار الفلاتر
  const queryParams = new URLSearchParams(params);
  const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
  history.replaceState(null, '', newUrl);

  Swal.fire({
    title: 'جاري تحميل النتائج...',
    didOpen: () => Swal.showLoading(),
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false
  });

  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('https://askprof-gojl.onrender.com/Professional/getProfessionalsByRating', {
      params,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    Swal.close();
    renderProfessionalCards(res.data.professionals || []);
  } catch (error) {
    console.error('❌ فشل في تطبيق الفلاتر:', error);
    Swal.fire({ icon: 'error', title: 'فشل جلب المهنيين' });
  }
};

//  استخراج التصفية من رابط URL وجلب المهنيين تلقائيًا
const fetchFilteredProfessionalsFromURL = async () => {
  const params = new URLSearchParams(window.location.search);
  const governorate = params.get('governorateName');
  const professionField = params.get('professionField');
  const targetRating = params.get('targetRating');

  if (!governorate || !professionField) return;

  Swal.fire({
    title: 'جاري تحميل النتائج...',
    didOpen: () => Swal.showLoading(),
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false
  });

  try {
    const requestParams = {
      governorateName: governorate,
      professionField: professionField
    };
    if (targetRating) requestParams.targetRating = targetRating;

    const res = await axios.get('https://askprof-gojl.onrender.com/Professional/getProfessionalsByRating', {
      params: requestParams
    });
    Swal.close();
    renderProfessionalCards(res.data.professionals || []);
  } catch (error) {
    console.error('❌ فشل جلب المهنيين من الرابط:', error);
    Swal.close();
  }
};

//  إعداد أزرار "استكشف" بناءً على اختيار المنطقة والمجال
const setupExploreButtons = () => {
  document.querySelectorAll('.btn-explore').forEach(btn =>
    btn.addEventListener('click', e => {
      e.preventDefault();
      const selectedGovernorate = document.querySelector('.governorates-select')?.value;
      const field = e.target.dataset.field;

      if (!selectedGovernorate || selectedGovernorate === 'اختر منطقتك') {
        return Swal.fire({
          icon: 'warning',
          title: 'يرجى اختيار المنطقة أولًا',
          confirmButtonText: 'حسنًا'
        });
      }

      const url = `/pages/professional.html?governorateName=${encodeURIComponent(selectedGovernorate)}&professionField=${encodeURIComponent(field)}`;
      window.location.href = url;
    })
  );
};

//للبحث عن اسم المهني
const handleSearch = async () => {
  const input = document.getElementById('searchInput');
  const name = input.value.trim();

  if (!name) {
    return Swal.fire({
      icon: 'warning',
      title: 'يرجى إدخال اسم المهني',
      confirmButtonText: 'موافق'
    });
  }

  Swal.fire({
    title: 'جاري البحث...',
    didOpen: () => Swal.showLoading(),
    allowOutsideClick: false,
    showConfirmButton: false
  });

  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('https://askprof-gojl.onrender.com/Professional/searchProfessionalsByName', {
      params: { name },
      headers: { Authorization: `Bearer ${token}` }
    });

    Swal.close();
    renderProfessionalCards(res.data.professionals || []);
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'فشل البحث عن المهني',
      text: 'تأكد من الاتصال أو المحاولة لاحقًا'
    });
    console.error(err);
  }
};

document.getElementById('searchBtn').addEventListener('click', handleSearch);

//  لتفعيل البحث بالضغط على Enter داخل حقل الإدخال
document.getElementById('searchInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSearch();
});



//  تنفيذ عند التحميل
document.addEventListener('DOMContentLoaded', async () => {
  const specialtySelect = document.getElementById('specialtySelect');
  const ratingSelect = document.getElementById('ratingSelect');
  const governorateSelect = document.getElementById('governorate');

  if (specialtySelect && ratingSelect && governorateSelect) {
    await populateSpecialtySelect(specialtySelect);
    await populateRatingSelect(ratingSelect);
    await populateGovernorateSelect(governorateSelect);

    document.querySelector('.btn_filter').addEventListener('click', applyFilters);

    document.querySelector('.btn-reset').addEventListener('click', () => {
      specialtySelect.selectedIndex = 0;
      ratingSelect.selectedIndex = 0;
      governorateSelect.selectedIndex = 0;
      document.getElementById('professionalsContainer').innerHTML = '';
      const cleanUrl = window.location.pathname;
      history.replaceState(null, '', cleanUrl);
      
    });
  }

  setupExploreButtons();
  fetchFilteredProfessionalsFromURL();
  
});
