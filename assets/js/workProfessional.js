//workProfessional.js
//  إظهار زر "تعديل الأعمال" و"إضافة عمل" فقط لصاحب الحساب

const toggleWorkButtons = () => {
  const editBtn = document.querySelector('.work-edit-btn');
  const addBtn = document.querySelector('.add-work-btn');

  const show = isProfileOwner(); // استخدم الدالة الموحدة
  if (editBtn) editBtn.style.display = show ? 'inline-block' : 'none';
  if (addBtn) addBtn.style.display = show ? 'inline-block' : 'none';
};

// جلب الأعمال من الباك
const fetchProfessionalWorks = async (id) => {
  try {
    const res = await axios.get(`https://askprof-gojl.onrender.com/ProfessionalProfile/getProfessionalWorks/${id}`);
    return res.data.works || [];
  } catch (err) {
    console.error('خطأ في جلب الأعمال:', err);
    return [];
  }
};

// عرض الأعمال في الصفحة

const renderProfessionalWorks = (works) => {
  const container = document.querySelector('.workContent');
  if (!container) return;

  container.innerHTML = '';

  if (works.length === 0) {
    container.innerHTML = '<p class="text-muted">لا توجد أعمال حالياً.</p>';
    return;
  }

  const isOwner = isProfileOwner(); // ✅ استخدام الدالة الموحدة

  works.forEach(work => {
    const encodedWork = encodeURIComponent(JSON.stringify(work));

    const editBtn = isOwner
      ? `<button class="btn btn-sm mt-2 me-2 edit-work-btn" data-work="${encodedWork}">تعديل</button>`
      : '';

    const deleteBtn = isOwner
      ? `<button class="btn btn-sm mt-2 delete-work-btn" onclick="deleteWork('${work.id}')">حذف</button>`
      : '';

    const showBtn = `
      <button class="btn btn-sm show-details-btn" data-work="${encodedWork}">
        عرض التفاصيل
      </button>
    `;

    const div = document.createElement('div');
    div.className = 'work p-4';

    div.innerHTML = `
      <div class="work-details d-flex flex-column flex-wrap justify-content-center align-items-center text-center">
        <span class="fw-bold">${work.placeWorkName || 'بدون عنوان'}</span>
        <p>${work.summaryAboutWork || 'لا يوجد وصف مختصر'}</p>
        ${showBtn}
        <div class="d-flex gap-2 justify-content-center mt-2">${editBtn} ${deleteBtn}</div>
      </div>
    `;

    container.appendChild(div);
  });
};





// عرض التفاصيل باستخدام SweetAlert2
const showWorkDetails = (work) => {
  const imagesHTML = work.images?.length
    ? `<div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; max-height: 300px; overflow-y: auto;">
        ${work.images.map(url => `
          <a href="${url}" target="_blank" title="اضغط للتكبير">
            <img src="${url}" style="width: 120px; height: 90px; object-fit: cover; border-radius: 6px; box-shadow: 0 0 4px #aaa; transition: transform 0.2s;" >
          </a>
        `).join('')}
      </div>`
    : '<p class="text-muted">لا توجد صور لهذا العمل.</p>';

  Swal.fire({
    title: work.placeWorkName || 'تفاصيل العمل',
    html: `
      ${imagesHTML}
      <hr>
      <h5 class="mt-3">النبذة:</h5>
      <p>${work.summaryAboutWork || 'لا توجد نبذة.'}</p>
      <h5>الوصف الكامل:</h5>
      <p>${work.description || 'لا يوجد وصف.'}</p>
    `,
    width: '700px',
    confirmButtonText: 'إغلاق'
  });
};



//إعداد زر "إضافة عمل"
const setupAddWorkButton = () => {
  const addBtn = document.querySelector('.add-work-btn');
  if (!addBtn || !isProfileOwner()) return;

  addBtn.addEventListener('click', async () => {
    let selectedFiles = [];

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;

    input.addEventListener('change', (e) => {
      const newFiles = Array.from(e.target.files);
      selectedFiles = [...selectedFiles, ...newFiles];

      const btn = Swal.getPopup().querySelector('#select-images-btn');
      if (btn) btn.innerHTML = `اختيار صور (${selectedFiles.length})`;

      const preview = Swal.getPopup().querySelector('#image-preview');
      if (preview) {
        preview.innerHTML = '';
        selectedFiles.forEach(file => {
          const reader = new FileReader();
          reader.onload = () => {
            const img = document.createElement('img');
            img.src = reader.result;
            img.style = 'width: 80px; height: 60px; object-fit: cover; margin: 4px; border-radius: 4px; box-shadow: 0 0 2px #aaa';
            preview.appendChild(img);
          };
          reader.readAsDataURL(file);
        });
      }
    });

    const { value: formValues } = await Swal.fire({
      title: 'إضافة عمل جديد',
      html: `
        <input id="work-title" class="swal2-input" placeholder="اسم مكان العمل">
        <textarea id="work-summary" class="swal2-textarea" placeholder="نبذة مختصرة"></textarea>
        <textarea id="work-description" class="swal2-textarea" placeholder="الوصف الكامل"></textarea>
        <button id="select-images-btn" type="button" class="swal2-confirm swal2-styled" style="margin-top: 10px; background-color: #3085d6;">
           اختيار صور (0)
        </button>
        <div id="image-preview" style="display:flex; flex-wrap:wrap; justify-content:center; margin-top:10px;"></div>
      `,
      didOpen: () => {
        document.getElementById('select-images-btn').addEventListener('click', () => input.click());
      },
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'حفظ',
      cancelButtonText: 'إلغاء',
      preConfirm: () => {
        const placeWorkName = document.getElementById('work-title').value.trim();
        const summaryAboutWork = document.getElementById('work-summary').value.trim();
        const description = document.getElementById('work-description').value.trim();

        if (!summaryAboutWork || !description) {
          Swal.showValidationMessage('النبذة والوصف مطلوبان');
          return false;
        }

        return { placeWorkName, summaryAboutWork, description };
      }
    });

    if (!formValues) return;

    const formData = new FormData();
    formData.append('placeWorkName', formValues.placeWorkName);
    formData.append('summaryAboutWork', formValues.summaryAboutWork);
    formData.append('description', formValues.description);

    selectedFiles.forEach(file => {
      formData.append('image', file);
    });

    try {
      Swal.fire({ title: 'جاري إضافة العمل...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });

      const id = getIdFromToken();
      const token = localStorage.getItem('token');

      await axios.post(
        `https://askprof-gojl.onrender.com/ProfessionalProfile/addProfessionalWork/${id}`,
        formData,
        {
          headers: {
            token,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      Swal.close();
      Swal.fire('تمت الإضافة', 'تم حفظ العمل بنجاح', 'success');

      const updated = await fetchProfessionalWorks(id);
      renderProfessionalWorks(updated);
    } catch (err) {
      Swal.close();
      console.error('فشل في إضافة العمل:', err);
      Swal.fire('خطأ', err.response?.data?.message || 'حدث خطأ أثناء إضافة العمل', 'error');
    }
  });
};


const editWork = async (work) => {
  if (!isProfileOwner()) return; // ✅ السماح فقط لصاحب الحساب

  const token = localStorage.getItem('token');
  const id = getIdFromToken(); // 🔁 نستخدم ID الحقيقي من التوكن لأنه صاحب الحساب أكيد

  let selectedFiles = [];

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;

  input.addEventListener('change', (e) => {
    const newFiles = Array.from(e.target.files);
    selectedFiles = [...selectedFiles, ...newFiles];

    const preview = Swal.getPopup().querySelector('#edit-image-preview');
    if (preview) {
      preview.innerHTML = '';
      selectedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = document.createElement('img');
          img.src = reader.result;
          img.style = 'width: 80px; height: 60px; object-fit: cover; margin: 4px; border-radius: 4px; box-shadow: 0 0 2px #aaa';
          preview.appendChild(img);
        };
        reader.readAsDataURL(file);
      });
    }

    const btn = Swal.getPopup().querySelector('#edit-select-images-btn');
    if (btn) {
      btn.innerHTML = `اختيار صور (${selectedFiles.length})`;
    }
  });

  const { value: formValues } = await Swal.fire({
    title: 'تعديل العمل',
    html: `
      <input id="edit-title" class="swal2-input" placeholder="اسم مكان العمل" value="${work.placeWorkName || ''}">
      <textarea id="edit-summary" class="swal2-textarea" placeholder="نبذة مختصرة">${work.summaryAboutWork || ''}</textarea>
      <textarea id="edit-description" class="swal2-textarea" placeholder="الوصف الكامل">${work.description || ''}</textarea>
      <button id="edit-select-images-btn" type="button" class="swal2-confirm swal2-styled" style="margin-top: 10px; background-color: #3085d6;">
        اختيار صور (0)
      </button>
      <div id="edit-image-preview" style="display:flex; flex-wrap:wrap; justify-content:center; margin-top:10px;"></div>
    `,
    didOpen: () => {
      document.getElementById('edit-select-images-btn').addEventListener('click', () => input.click());
    },
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'حفظ',
    cancelButtonText: 'إلغاء',
    preConfirm: () => {
      const placeWorkName = document.getElementById('edit-title').value.trim();
      const summaryAboutWork = document.getElementById('edit-summary').value.trim();
      const description = document.getElementById('edit-description').value.trim();

      if (!summaryAboutWork || !description) {
        Swal.showValidationMessage('النبذة والوصف مطلوبان');
        return false;
      }

      return { placeWorkName, summaryAboutWork, description };
    }
  });

  if (!formValues) return;

  const formData = new FormData();
  formData.append('placeWorkName', formValues.placeWorkName);
  formData.append('summaryAboutWork', formValues.summaryAboutWork);
  formData.append('description', formValues.description);

  selectedFiles.forEach(file => {
    formData.append('image', file);
  });

  try {
    Swal.fire({ title: 'جاري التعديل...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });

    await axios.put(
      `https://askprof-gojl.onrender.com/ProfessionalProfile/editProfessionalWork/${work.id}`,
      formData,
      {
        headers: {
          token,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    Swal.close();
    Swal.fire('تم التعديل', 'تم حفظ التعديلات بنجاح', 'success');

    const updated = await fetchProfessionalWorks(id);
    renderProfessionalWorks(updated);
  } catch (err) {
    Swal.close();
    console.error('فشل في التعديل:', err);
    Swal.fire('خطأ', err.response?.data?.message || 'حدث خطأ أثناء التعديل', 'error');
  }
};

const deleteWork = async (workId) => {
  if (!isProfileOwner()) return; // ✅ منع الحذف لغير صاحب الحساب

  const token = localStorage.getItem('token');
  const professionalId = getIdFromToken(); // ✅ استخدم ID من التوكن لأنه صاحب الحساب

  const confirmed = await Swal.fire({
    title: 'تأكيد الحذف',
    text: 'هل أنت متأكد أنك تريد حذف هذا العمل؟',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'نعم، احذفه',
    cancelButtonText: 'إلغاء'
  });

  if (!confirmed.isConfirmed) return;

  try {
    Swal.fire({ title: 'جارٍ الحذف...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });

    await axios.delete(`https://askprof-gojl.onrender.com/ProfessionalProfile/deleteWork/${workId}`, {
      headers: { token }
    });

    Swal.close();
    Swal.fire('تم الحذف', 'تم حذف العمل بنجاح', 'success');

    const updated = await fetchProfessionalWorks(professionalId);
    renderProfessionalWorks(updated);
  } catch (err) {
    Swal.close();
    console.error('فشل في حذف العمل:', err);
    Swal.fire('خطأ', err.response?.data?.message || 'حدث خطأ أثناء حذف العمل', 'error');
  }
};

//  مستمع لزر "عرض التفاصيل"
document.addEventListener('click', (e) => {
  if (e.target.matches('.show-details-btn')) {
    const workStr = e.target.getAttribute('data-work');
    try {
      const work = JSON.parse(decodeURIComponent(workStr));
      showWorkDetails(work);
    } catch (err) {
      console.error('فشل في فك بيانات العمل لعرض التفاصيل:', err);
      Swal.fire('خطأ', 'حدث خطأ أثناء عرض تفاصيل العمل', 'error');
    }
  }
});


document.addEventListener('click', (e) => {
  if (e.target.matches('.edit-work-btn')) {
    const workStr = e.target.getAttribute('data-work');
    const work = JSON.parse(decodeURIComponent(workStr));
    editWork(work);
  }
});


//تحميل البيانات عند فتح الصفحة
document.addEventListener('DOMContentLoaded', async () => {
  const professionalId = getProfessionalIdFromURL();
  if (!professionalId) return;

  const works = await fetchProfessionalWorks(professionalId);
  renderProfessionalWorks(works);

  toggleWorkButtons();
  setupAddWorkButton();
});

/*
document.addEventListener('DOMContentLoaded', async () => {
  const id = getProfessionalIdFromURL();
  if (!id) return;

  toggleWorkButtons();

  const works = await fetchProfessionalWorks(id);
  renderProfessionalWorks(works);
  setupAddWorkButton();
});
*/