//profile.js

const toggleEditButtonVisibility = () => {
  const pageId = getProfessionalIdFromURL();
  const tokenId = getIdFromToken();
  const editBtn = document.getElementById('editDescriptionBtn');
  if (!editBtn) return;
  editBtn.classList.toggle('d-none', pageId !== tokenId);
};

const toggleMainEditButton = () => {
  const pageId = getProfessionalIdFromURL();
  const tokenId = getIdFromToken();
  const mainEditBtn = document.getElementById('edit-btn');
  if (!mainEditBtn) return;
  mainEditBtn.classList.toggle('d-none', pageId !== tokenId);
};

const toggleDeleteButtonVisibility = () => {
  const pageId = getProfessionalIdFromURL();
  const tokenId = getIdFromToken();
  const deleteBtn = document.getElementById('deleteVideoBtn');
  if (!deleteBtn) return;
  deleteBtn.classList.toggle('d-none', pageId !== tokenId);
};

const fetchGovernorates = async () => {
  try {
    const res = await axios.get('https://askprof-gojl.onrender.com/governorate/getgovernorate');
    return res.data.governorates || [];
  } catch (err) {
    console.error('خطأ أثناء جلب المحافظات:', err);
    return [];
  }
};

const injectGovernorates = async () => {
  const select = document.getElementById('governorateSelect');
  if (!select) return;
  const governorates = await fetchGovernorates();
  governorates.forEach((gov) => {
    const option = document.createElement('option');
    option.value = gov._id;
    option.textContent = gov.name;
    select.appendChild(option);
  });
};

const loadProfilePicture = async () => {
  const id = getProfessionalIdFromURL();
  const img = document.getElementById('profileImage');
  const icon = document.getElementById('defaultUserIcon');
  if (!id || !img || !icon) return;
  try {
    const res = await axios.get(`https://askprof-gojl.onrender.com/ProfessionalProfile/getProfilePicture/${id}`);
    const imageUrl = res.data?.imageUrl;
    if (imageUrl) {
      img.src = imageUrl;
      img.style.display = 'block';
      icon.classList.add('d-none');
      img.onerror = () => {
        img.style.display = 'none';
        icon.classList.remove('d-none');
      };
    } else {
      img.style.display = 'none';
      icon.classList.remove('d-none');
    }
  } catch {
    img.style.display = 'none';
    icon.classList.remove('d-none');
  }
};

const toggleImageOverlay = () => {
  const pageId = getProfessionalIdFromURL();
  const tokenId = getIdFromToken();
  const overlay = document.querySelector('.image-overlay');
  if (!overlay) return;
  overlay.classList.toggle('d-none', pageId !== tokenId);
};

const loadProfessionalDescription = async () => {
  const id = getProfessionalIdFromURL();
  const container = document.getElementById('about-professional');
  if (!id || !container) return;
  try {
    const res = await axios.get(`https://askprof-gojl.onrender.com/ProfessionalProfile/getProfessionalDescription/${id}`);
    container.textContent = res.data.description || 'لا توجد نبذة متاحة.';
  } catch (err) {
    console.error('❌ خطأ في تحميل الوصف:', err);
    container.textContent = 'فشل تحميل النبذة.';
  }
};

const setupEditButton = () => {
  const id = getIdFromToken();
  const editBtn = document.getElementById('editDescriptionBtn');
  if (!id || !editBtn) return;
  editBtn.addEventListener('click', async () => {
    const currentDescription = document.getElementById('about-professional').textContent;
    const { value: newDescription } = await Swal.fire({
      title: 'تعديل نبذة المهني',
      input: 'textarea',
      inputLabel: 'اكتب النبذة الجديدة',
      inputValue: currentDescription,
      showCancelButton: true,
      confirmButtonText: 'حفظ',
      cancelButtonText: 'إلغاء',
      inputValidator: (value) => (!value ? 'النبذة لا يمكن أن تكون فارغة' : undefined)
    });
    if (newDescription) {
      try {
        await axios.put(
          `https://askprof-gojl.onrender.com/ProfessionalProfile/updateProfessionalDescription/${id}`,
          { description: newDescription },
          { headers: { token: localStorage.getItem('token') } }
        );
        document.getElementById('about-professional').textContent = newDescription;
        Swal.fire('تم الحفظ', 'تم تحديث النبذة بنجاح', 'success');
      } catch (err) {
        console.error('فشل في التحديث:', err);
        Swal.fire('خطأ', 'حدث خطأ أثناء حفظ التعديل', 'error');
      }
    }
  });
};

// تحميل وتحديث بيانات البروفايل كاملة
document.addEventListener('DOMContentLoaded', async () => {
  const id = getProfessionalIdFromURL();
  const token = localStorage.getItem('token');

  if (!id) {
    Swal.fire({ icon: 'error', title: 'تعذر تحميل الصفحة', text: 'المعرف غير موجود في الرابط.' });
    return;
  }

  Swal.fire({ title: 'جاري تحميل البيانات...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  try {
    await injectGovernorates();

    const profileRes = await axios.get(`https://askprof-gojl.onrender.com/ProfessionalProfile/getProfessionalProfile/${id}`);
    const professional = profileRes.data;
    handleProfileEdit(id, professional);
    await loadProfilePicture();
    toggleImageOverlay();
    toggleEditButtonVisibility();
    setupEditButton();
    await loadProfessionalDescription();
    setupVideoPlayback();
    await loadProfessionalVideo();
    toggleVideoUploadSection();
    toggleMainEditButton();
    toggleDeleteButtonVisibility();
    
    document.querySelector('.profile-name').textContent = professional.username || 'بدون اسم';
    document.querySelector('.profile-role').textContent = professional.professionField || 'بدون تخصص';
    document.querySelector('.profile-bio').textContent = professional.bio || 'لا توجد نبذة حالياً';
    document.querySelector('.profile-location').textContent = `${professional.city || ''}، ${professional.governorate || ''}`;
    document.querySelector('.profile-email').textContent = professional.anotheremail || '';
    document.querySelector('.profile-phone').textContent = professional.phoneNumber || '';

    // ✅ زر المراسلة (يُعرض فقط إذا لم يكن صاحب الحساب)
const profileOwnerId = getProfessionalIdFromURL();
const loggedInUserId = getIdFromToken();

if (loggedInUserId && profileOwnerId && loggedInUserId !== profileOwnerId) {
  const messageBtn = document.createElement("a");
  messageBtn.href = `../pages/professionalChat.html?professionalId=${professional.id}`;
  messageBtn.className = "btn bg-body-secondary	text-muted mt-3"; // يمكنك تعديل الكلاس حسب التصميم
  messageBtn.textContent = "مراسلة";

  // إضافته في المكان المناسب (مثلاً بعد رقم الهاتف)
  document.querySelector('.profile-phone').after(messageBtn);
}

    const govSelect = document.getElementById('governorateSelect');
    if (govSelect && professional.originalGovernorate) {
      const matched = [...govSelect.options].find(opt => opt.textContent === professional.originalGovernorate);
      if (matched) matched.selected = true;
    }

    Swal.close();
  } catch (err) {
    console.error('خطأ في جلب بيانات المهني:', err);
    Swal.fire({ icon: 'error', title: 'تعذر تحميل البيانات', text: 'فشل في تحميل البيانات.' });
  }

  // رفع صورة البروفايل
  const uploadBtn = document.getElementById('uploadImageBtn');
  const fileInput = document.getElementById('imageUpload');
  const profileImage = document.getElementById('profileImage');

  if (!uploadBtn || !fileInput || !profileImage) return;

  uploadBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      Swal.fire({ title: 'جاري رفع الصورة...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });

      const res = await axios.put(
        `https://askprof-gojl.onrender.com/ProfessionalProfile/uploadProfilePicture/${id}`,
        formData,
        {
          headers: {
            token,
            'Content-Type': 'multipart/form-data'
          }
        }
        
      );
      

      Swal.close();
      Swal.fire('تم التحديث', 'تم رفع الصورة بنجاح', 'success');
      profileImage.src = res.data.imageUrl;
      profileImage.style.display = 'block';

    } catch (err) {
      Swal.close();
      console.error('فشل رفع الصورة:', err.response?.data || err);
      Swal.fire('خطأ', err.response?.data?.message || 'فشل رفع الصورة', 'error');
    }
  });
  

});

//سكشن عرض الفديو بس بظهر للمهني يلي لاله الصفحة
const toggleVideoUploadSection = () => {
  const pageId = getProfessionalIdFromURL();
  const tokenId = getIdFromToken();
  const section = document.getElementById('videoUploadSection');
  if (!section) return;

  if (pageId === tokenId) {
    section.classList.remove('d-none');
  } else {
    section.classList.add('d-none');
  }
};
// دالة وهمية ترجع المجالات المهنية (مستقبلًا ستجيبها من الباك)
async function fetchProfessionFields() {
  return [
    { name: 'ورشات البناء' },
    { name: 'الكهربائيات' },
    { name: 'التنكولوجيا' }
  ];
}

const handleProfileEdit = async (id, data) => {
  if (getIdFromToken() !== getProfessionalIdFromURL()) return;

  const editBtn = document.querySelector('#edit-btn');
  if (!editBtn) return;

  const newEditBtn = editBtn.cloneNode(true);
  editBtn.parentNode.replaceChild(newEditBtn, editBtn);

  newEditBtn.addEventListener('click', async () => {
    const governorates = await fetchGovernorates();
    const professionFields = await fetchProfessionFields();

    // إعداد خيارات المحافظات
    let governorateOptions = '';
    governorates.forEach(gov => {
      const selected = gov.name === data.governorate ? 'selected' : '';
      governorateOptions += `<option value="${gov.name}" ${selected}>${gov.name}</option>`;
    });
    const defaultGovernorateOption = !data.governorate
      ? `<option value="" selected disabled>اختر المحافظة</option>`
      : `<option value="" disabled>اختر المحافظة</option>`;

    // إعداد خيارات المجالات المهنية
    let professionOptions = '';
    professionFields.forEach(prof => {
      const selected = prof.name === data.professionField ? 'selected' : '';
      professionOptions += `<option value="${prof.name}" ${selected}>${prof.name}</option>`;
    });
    const defaultProfessionOption = !data.professionField
      ? `<option value="" selected disabled>اختر المجال المهني</option>`
      : `<option value="" disabled>اختر المجال المهني</option>`;

    Swal.fire({
      title: 'تعديل الملف الشخصي',
      customClass: {
    popup: 'custom-swal' // <-- فقط هذه التنبيهات ستتأثر
  },
      html: `
       <img src="${data.profilePicture}" alt="الصورة الشخصية" class="profile-picture-preview">
        <input id="edit-username" class="swal2-input" placeholder="الاسم" value="${data.username || ''}">
        <select id="edit-profession" class="swal2-select">
          ${defaultProfessionOption}
          ${professionOptions}
        </select>
        <textarea id="edit-bio" class="swal2-textarea" placeholder="النبذة">${data.bio || ''}</textarea>
        <input id="edit-city" class="swal2-input" placeholder="المدينة" value="${data.city || ''}">
        <select id="edit-governorate" class="swal2-select">
          ${defaultGovernorateOption}
          ${governorateOptions}
        </select>
        <input id="edit-email" class="swal2-input" placeholder="البريد الإلكتروني" value="${data.anotheremail || ''}">
        <input id="edit-phone" class="swal2-input" placeholder="رقم الهاتف" value="${data.phoneNumber || ''}">
      `,
      showCancelButton: true,
      confirmButtonText: 'حفظ',
      cancelButtonText: 'إلغاء',
      preConfirm: () => {
        const username = document.getElementById('edit-username').value.trim();
        const bio = document.getElementById('edit-bio').value.trim();
        const city = document.getElementById('edit-city').value.trim();
        const governorate = document.getElementById('edit-governorate').value;
        const anotheremail = document.getElementById('edit-email').value.trim();
        const phoneNumber = document.getElementById('edit-phone').value.trim();
        const professionField = document.getElementById('edit-profession').value;

        if (!username || !bio || !professionField) {
          Swal.showValidationMessage('يرجى تعبئة الحقول الإلزامية');
          return false;
        }

        if (!governorate) {
          Swal.showValidationMessage('يرجى اختيار المحافظة');
          return false;
        }

        return { username, bio, city, governorate, anotheremail, phoneNumber, professionField };
      }
    }).then(async result => {
      if (result.isConfirmed) {
        try {
          await axios.put(
            `https://askprof-gojl.onrender.com/ProfessionalProfile/updateProfessionalProfile/${id}`,
            result.value,
            { headers: { token: localStorage.getItem('token') } }
          );

          Swal.fire('تم التحديث', 'تم حفظ التعديلات بنجاح', 'success');

          document.querySelector('.profile-name').textContent = result.value.username;
          document.querySelector('.profile-role').textContent = result.value.professionField;
          document.querySelector('.profile-bio').textContent = result.value.bio;
          document.querySelector('.profile-location').textContent = `${result.value.city}، ${result.value.governorate}`;
          document.querySelector('.profile-email').textContent = result.value.anotheremail;
          document.querySelector('.profile-phone').textContent = result.value.phoneNumber;

        } catch (err) {
          console.error('فشل في التحديث:', err);
          Swal.fire('خطأ', 'حدث خطأ أثناء حفظ البيانات', 'error');
        }
      }
    });
  });
};


const setupVideoPlayback = () => {
  const playBtn = document.querySelector('.play-button');
  const videoElement = document.getElementById('introVideo');
  const videoSource = document.getElementById('videoSource');
  const thumbnail = document.getElementById('videoThumbnail');
  const id = getProfessionalIdFromURL();

  if (!playBtn || !videoElement || !videoSource || !thumbnail || !id) return;

  // استبدال الزر لمنع تكرار الحدث
  const newPlayBtn = playBtn.cloneNode(true);
  playBtn.parentNode.replaceChild(newPlayBtn, playBtn);

  newPlayBtn.addEventListener('click', async () => {
    // أخفي فوراً صورة الغلاف والزر
    thumbnail.style.display = 'none';
    newPlayBtn.style.display = 'none';
    videoElement.style.display = 'none';

    try {
      const res = await axios.get(`https://askprof-gojl.onrender.com/ProfessionalProfile/getVideo/${id}`);
      const videoUrl = res.data?.videoUrl;

      if (videoUrl) {
        videoSource.src = videoUrl;
        videoElement.load();

        // استنى حتى يتم تحميل بيانات الفيديو قبل التشغيل
        videoElement.onloadeddata = () => {
          videoElement.style.display = 'block';
          videoElement.play().catch(err => {
            console.warn('فشل تشغيل الفيديو:', err);
          });
        };
      } else {
        Swal.fire('لا يوجد فيديو', 'هذا المهني لم يرفع فيديو بعد.', 'info');
        // في حال لا يوجد فيديو، رجع صورة الغلاف والزر
        thumbnail.style.display = 'block';
        newPlayBtn.style.display = 'block';
      }
    } catch (err) {
      console.error('فشل تحميل الفيديو:', err);
      Swal.fire('خطأ', 'حدث خطأ أثناء تحميل الفيديو', 'error');
      // في حال الخطأ، رجع صورة الغلاف والزر
      thumbnail.style.display = 'block';
      newPlayBtn.style.display = 'block';
    }
  });
};

//تحميل الفيديو تلقائيًا عند تحميل الصفحة
const loadProfessionalVideo = async () => {
  const id = getProfessionalIdFromURL();
  const videoElement = document.getElementById('introVideo');
  const videoSource = document.getElementById('videoSource');
  const thumbnail = document.getElementById('videoThumbnail');
  const playBtn = document.querySelector('.play-button');

  if (!id || !videoElement || !videoSource || !thumbnail || !playBtn) return;

  // ✅ أخفيهم مؤقتًا عشان ما يبينوا أثناء SweetAlert
  thumbnail.style.display = 'none';
  playBtn.style.display = 'none';
  videoElement.style.display = 'none';

  try {
    const res = await axios.get(`https://askprof-gojl.onrender.com/ProfessionalProfile/getVideo/${id}`);
    const videoUrl = res.data?.videoUrl;

    if (videoUrl) {
      videoSource.src = videoUrl;
      videoElement.load();
      videoElement.style.display = 'block';
    } else {
      // ✅ ما في فيديو - ارجع أظهر الثابت وزر التشغيل
      thumbnail.style.display = 'block';
      playBtn.style.display = 'block';
    }
  } catch (err) {
    console.error('فشل في تحميل الفيديو التلقائي:', err);
    // ✅ في حال الخطأ، رجع صورة التشغيل
    thumbnail.style.display = 'block';
    playBtn.style.display = 'block';
  }
};

document.getElementById('uploadVideoBtn').addEventListener('click', async () => {
  const fileInput = document.getElementById('videoUpload');
  const file = fileInput.files[0];
  const token = localStorage.getItem('token');
  const id = getIdFromToken(); // أو من الرابط

  if (!file) {
    Swal.fire('تنبيه', 'يرجى اختيار فيديو لرفعه', 'warning');
    return;
  }

  const formData = new FormData();
  formData.append('video', file);

  // SweetAlert with dynamic progress
  Swal.fire({
    title: 'جارٍ رفع الفيديو...',
    html: `
      <div class="progress" style="height: 25px;">
        <div id="uploadProgressBar" class="progress-bar progress-bar-striped progress-bar-animated"
             role="progressbar" style="width: 0%">0%</div>
      </div>
    `,
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    const res = await axios.put(
      `https://askprof-gojl.onrender.com/ProfessionalProfile/uploadVideo/${id}`,
      formData,
      {
        headers: {
          token,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          const progressBar = document.getElementById('uploadProgressBar');
          if (progressBar) {
            progressBar.style.width = `${percent}%`;
            progressBar.textContent = `${percent}%`;
          }
        }
      }
    );

    Swal.close();
    Swal.fire('تم', 'تم رفع الفيديو بنجاح', 'success');

    // تحديث الفيديو مباشرة
    const video = document.getElementById('introVideo');
    const videoSource = document.getElementById('videoSource');
    videoSource.src = res.data.videoUrl;
    video.load();
    video.style.display = 'block';
    video.play();

    // إخفاء الصورة وزر التشغيل
    document.getElementById('videoThumbnail').style.display = 'none';
    document.querySelector('.play-button').style.display = 'none';

  } catch (err) {
    Swal.close();
    console.error('فشل رفع الفيديو:', err);
    Swal.fire('خطأ', err.response?.data?.message || 'فشل رفع الفيديو', 'error');
  }
});

document.getElementById('deleteVideoBtn').addEventListener('click', async () => {
  const id = getIdFromToken();
  const token = localStorage.getItem('token');

  if (!id || !token) {
    Swal.fire('خطأ', 'لم يتم العثور على صلاحيات الحذف', 'error');
    return;
  }

  const result = await Swal.fire({
    title: 'هل أنت متأكد؟',
    text: "لن تستطيع استرجاع الفيديو بعد الحذف!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'نعم، احذفه',
    cancelButtonText: 'إلغاء',
  });

  if (result.isConfirmed) {
    try {
      Swal.fire({title: 'جارٍ حذف الفيديو...', didOpen: () => Swal.showLoading(), allowOutsideClick: false});

      await axios.delete(`https://askprof-gojl.onrender.com/ProfessionalProfile/deleteVideo/${id}`, {
        headers: { token }
      });

      Swal.close();
      Swal.fire('تم', 'تم حذف الفيديو بنجاح', 'success');

      // تنظيف العرض بعد الحذف
      const videoElement = document.getElementById('introVideo');
      const videoSource = document.getElementById('videoSource');
      const thumbnail = document.getElementById('videoThumbnail');
      const playBtn = document.querySelector('.play-button');

      videoSource.src = '';
      videoElement.load();
      videoElement.style.display = 'none';
      thumbnail.style.display = 'block';
      playBtn.style.display = 'block';

    } catch (err) {
      Swal.close();
      console.error('فشل حذف الفيديو:', err);
      Swal.fire('خطأ', err.response?.data?.message || 'فشل حذف الفيديو', 'error');
    }
  }
});
