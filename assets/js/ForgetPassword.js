/*const emailForm = document.getElementById('emailForm');
const resetForm = document.getElementById('resetForm');
const emailInput = document.getElementById('emailInput');
const emailReset = document.getElementById('emailReset');

emailForm.addEventListener('submit', function(event) {
  event.preventDefault();

  // هنا يمكن إضافة منطق إرسال الرمز عبر API أو أي خدمة

  // نسخ البريد الإلكتروني إلى نموذج إعادة تعيين كلمة المرور تلقائيًا
  emailReset.value = emailInput.value;

  // إظهار نموذج إعادة تعيين كلمة المرور وإخفاء النموذج الأول
  emailForm.style.display = 'none';
  resetForm.style.display = 'block';
});

resetForm.addEventListener('submit', function(event) {
  event.preventDefault();

  // هنا يمكن إضافة منطق التحقق من الرمز وتحديث كلمة المرور عبر API

  alert('تم تحديث كلمة المرور بنجاح!');
  // يمكنك إعادة توجيه المستخدم أو إعادة تحميل الصفحة أو غير ذلك
  // location.href = "/login.html";
});
*/

document.addEventListener('DOMContentLoaded', () => { 
  const emailForm = document.getElementById('emailForm');
  const resetForm = document.getElementById('resetForm');
  const emailInput = document.getElementById('emailInput');
  const emailReset = document.getElementById('emailReset');
  const codeInput = document.getElementById('codeInput');
  const newPassword = document.getElementById('newPassword');

  // إرسال البريد
  emailForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const email = emailInput.value.trim();
    if (!email) {
      alert('يرجى إدخال البريد الإلكتروني');
      return;
    }

    try {
      const res = await axios.post('https://askprof-gojl.onrender.com/auth/sendCode', { email });

      console.log("🔁 رد السيرفر:", res.data);
      if (res.data.code) {
        alert(`رمز التحقق هو: ${res.data.code}`);
      }

      emailReset.value = email;
      emailForm.style.display = 'none';
      resetForm.style.display = 'block';
    } catch (error) {
      alert(error.response?.data?.message || 'حدث خطأ أثناء إرسال الرمز');
    }
  });

  // إعادة تعيين كلمة المرور
  resetForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const email = emailReset.value.trim();
    const code = codeInput.value.trim();
    const password = newPassword.value.trim();

    if (!email || !code || !password) {
      alert('يرجى تعبئة جميع الحقول');
      return;
    }

    try {
      await axios.post('https://askprof-gojl.onrender.com/auth/resetPassword', {
        email,
        code,
        password
      });

      // ✅ تحديث localStorage بكلمة السر الجديدة
      localStorage.setItem('savedEmail', email);
      localStorage.setItem('savedPassword', password);

      alert('تم تحديث كلمة المرور بنجاح! سيتم تحويلك إلى صفحة تسجيل الدخول...');
      location.href = "../pages/login.html";

    } catch (error) {
      alert(error.response?.data?.message || 'فشل في تحديث كلمة المرور');
    }
  });
});


