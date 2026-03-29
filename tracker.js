/**
* MOBSPOT Custom Analytics Tracker
* Leve, assíncrono e em conformidade com a LGPD (Rastreamento Anônimo).
*/
(function() {
    // SUBSTITUA PELO URL DO SEU WEBHOOK (Google Apps Script)
    const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbysxXApr72BGYJe0hB3DzMzTD8lG1lni0hMn5JTsAutRW0oVSjNaEJCkpq-yMGHFyIT/exec';
    // Gera um UUID anônimo para identificar unicamente o dispositivo
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    // Identifica se o usuário é Novo ou Repetido
    let userId = localStorage.getItem('mobspot_anon_id');
    let userType = 'Returning';
    
    if (!userId) {
        userId = generateUUID();
        localStorage.setItem('mobspot_anon_id', userId);
        userType = 'New';
    }

    // Captura dados do dispositivo
    function getDeviceData() {
        const ua = navigator.userAgent;
        let browser = 'Unknown', os = 'Unknown';

        if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
        else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browser = 'Opera';
        else if (ua.indexOf('Trident') > -1) browser = 'IE';
        else if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) browser = 'Edge';
        else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
        else if (ua.indexOf('Safari') > -1) browser = 'Safari';

        if (ua.indexOf('Win') > -1) os = 'Windows';
        else if (ua.indexOf('Mac') > -1) os = 'MacOS';
        else if (ua.indexOf('Linux') > -1) os = 'Linux';
        if (/Android/.test(ua)) os = 'Android';
        if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';

        return {
            browser: browser,
            os: os,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            isMobile: /Mobi|Android|iPhone/i.test(ua)
        };
    }

    // Objeto central que armazenará os dados da sessão
    const sessionData = {
        userId: userId,
        userType: userType,
        device: getDeviceData(),
        url: window.location.href,
        referrer: document.referrer,
        sessionStart: new Date().toISOString(),
        clicks: []
    };

    // Monitora cliques em links e botões
    document.addEventListener('click', function(e) {
        // Pega o elemento clicado ou o link/botão pai mais próximo
        const el = e.target.closest('a, button');
        if (el) {
            // 1. Tenta identificar de forma exata usando atributo customizado, texto interno ou aria-label
            let btnId = el.getAttribute('data-track') || 
                        el.innerText.trim().substring(0, 100) || 
                        el.getAttribute('aria-label');
            
            // 2. Fallbacks inteligentes para botões de ícone (que não têm texto)
            if (!btnId) {
                if (el.classList.contains('whatsapp-btn')) btnId = 'WhatsApp Flutuante';
                else if (el.querySelector('.fa-linkedin')) btnId = 'LinkedIn Footer';
                else if (el.querySelector('.fa-instagram')) btnId = 'Instagram Footer';
                else btnId = 'Botão sem texto / Apenas Ícone';
            }

            sessionData.clicks.push({
                identificacao: btnId,
                classes: el.className || 'sem-classe',
                href: el.href || null,
                time: new Date().toISOString()
            });
        }
    });

    // Envia os dados ao fechar/sair da página usando sendBeacon
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden') {
            // Usamos text/plain para evitar o erro de CORS (preflight OPTIONS) no Google Apps Script
            const payload = new Blob([JSON.stringify(sessionData)], { type: 'text/plain;charset=UTF-8' });
            navigator.sendBeacon(WEBHOOK_URL, payload);
        }
    });
})();
