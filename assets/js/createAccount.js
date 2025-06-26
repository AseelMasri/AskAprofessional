document.addEventListener('DOMContentLoaded', () => {
  loadGovernorates();
  setupGovernorateSelection();
  setupPasswordToggle();
  setupFormSubmit();
  setupLiveValidation();
});

async function loadGovernorates() {
  try {
    const { data } = await axios.get('https://askprof-gojl.onrender.com/governorate/getgovernorate');
    const select = document.getElementById('originalGovernorate');
    data.governorates.forEach(gov => {
      const opt = document.createElement('option');
      opt.value = gov.name;
      opt.textContent = gov.name;
      select.appendChild(opt);
    });
  } catch (error) {
    console.error('خطأ أثناء تحميل المحافظات:', error);
  }
}

function setupGovernorateSelection() {
  const userRadio = document.getElementById('user');
  const profRadio = document.getElementById('professional');
  const governorateSelect = document.getElementById('originalGovernorate');
  const departmentSelect = document.getElementById('professionField');

  userRadio.addEventListener('change', () => {
    governorateSelect.disabled = true;
    governorateSelect.value = '';
    departmentSelect.disabled = true;
    departmentSelect.value = '';
  });

  profRadio.addEventListener('change', () => {
    governorateSelect.disabled = false;
    departmentSelect.disabled = false;
  });

  // عند تحميل الصفحة لأول مرة
  if (userRadio.checked) {
    governorateSelect.disabled = true;
    departmentSelect.disabled = true;
  } else if (profRadio.checked) {
    governorateSelect.disabled = false;
    departmentSelect.disabled = false;
  }
}

function setupPasswordToggle() {
  document.querySelectorAll('.toggle-password').forEach(icon => {
    icon.addEventListener('click', () => {
      const input = icon.previousElementSibling;
      input.type = input.type === 'password' ? 'text' : 'password';
      icon.classList.toggle('fa-eye');
      icon.classList.toggle('fa-eye-slash');
    });
  });
}

function setupLiveValidation() {
  const form = document.getElementById('createForm');
  form.querySelectorAll('input, select').forEach(inp => {
    const evt = inp.tagName.toLowerCase() === 'select' ? 'change' : 'input';
    inp.addEventListener(evt, () => validateField(inp));
  });
}

function validateField(input) {
  const v = input.value.trim();

  if (input.id === 'username') {
    return v.length >= 3
      ? showSuccess(input)
      : showError(input, '3 أحرف على الأقل');
  }

  if (input.id === 'email') {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(v)
      ? showSuccess(input)
      : showError(input, 'بريد إلكتروني غير صالح');
  }

  if (input.id === 'phone') {
    const re = /^[0-9]{6,12}$/;
    return re.test(v)
      ? showSuccess(input)
      : showError(input, 'رقم غير صالح');
  }

  if (input.id === 'password') {
    const ok = v.length >= 6 && /[A-Z]/.test(v) && /\d/.test(v);
    return ok
      ? showSuccess(input)
      : showError(input, '6 أحرف على الأقل، حرف كبير ورقم');
  }

  if (input.id === 'passwordConfirm') {
    return v === document.getElementById('password').value.trim()
      ? showSuccess(input)
      : showError(input, 'كلمة المرور غير متطابقة');
  }

  if (input.id === 'birthDate') {
    return v ? showSuccess(input) : showError(input, 'اختر تاريخ الميلاد');
  }

  if (input.id === 'originalGovernorate') {
    if (!input.disabled && !v) return showError(input, 'اختر المحافظة');
    return showSuccess(input);
  }
  if (input.id === 'professionField') {
  if (!input.disabled && !v) return showError(input, 'اختر المجال المهني');
  return showSuccess(input);
}

}

function setupFormSubmit() {
  const form = document.getElementById('createForm');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validateForm()) {
      return Swal.fire({
        icon: 'error',
        title: 'تحقق من الحقول!',
        text: 'يرجى تصحيح الأخطاء الموجودة بالنموذج.',
      });
    }

    const userData = collectFormData();
    try {
      Swal.fire({ title: 'جاري الإرسال...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      await axios.post('https://askprof-gojl.onrender.com/auth/register', userData);
      Swal.fire({ icon: 'success', title: 'تم إنشاء الحساب بنجاح!', timer: 2000, showConfirmButton: false });
      setTimeout(() => window.location.href = '../pages/login.html', 2000);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'حدث خطأ!',
        text: err.response?.data?.message || 'حدث خطأ غير متوقع، حاول لاحقاً.',
      });
    }
  });
}

function validateForm() {
  let valid = true;
  const form = document.getElementById('createForm');

  form.querySelectorAll('input, select').forEach(inp => {
    validateField(inp);
    if (inp.classList.contains('is-invalid')) valid = false;
  });

  if (!form.querySelector('input[name="gender"]:checked')) valid = false;
  if (!form.querySelector('input[name="usertype"]:checked')) valid = false;

  return valid;
}

function collectFormData() {
  const f = document.getElementById('createForm');
  const els = f.elements;

  const phoneInput = els['phone'].value.trim();
  const countryCode = els['countryCode'].value;
  const usertype = f.querySelector('input[name="usertype"]:checked').value;

  const data = {
    username: els['username'].value.trim(),
    email: els['email'].value.trim(),
    phoneNumber: countryCode + phoneInput,
    password: els['password'].value,
    birthdate: els['birthDate'].value,
    gender: f.querySelector('input[name="gender"]:checked').value,
    usertype: usertype,
  };

  if (usertype === 'مهني') {
    data.originalGovernorate = els['originalGovernorate'].value;
    data.professionField = els['professionField'].value;

  }

  return data;
}

function showSuccess(input) {
  input.classList.remove('is-invalid');
  input.classList.add('is-valid');
  const fb = input.parentElement.querySelector('.invalid-feedback');
  if (fb) fb.textContent = '';
}

function showError(input, message) {
  input.classList.remove('is-valid');
  input.classList.add('is-invalid');
  const fb = input.parentElement.querySelector('.invalid-feedback');
  if (fb) fb.textContent = message;
}
