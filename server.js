const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const os = require('os');
const localtunnel = require('localtunnel');
const { exec } = require('child_process');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'database.json');

// ============================
// EMAIL CONFIGURATION
// ============================
// Gmail ile e-posta göndermek için App Password gereklidir.
// Google Hesabınız → Güvenlik → 2 Adımlı Doğrulama → Uygulama Şifreleri
// Oradan bir şifre oluşturup aşağıya yapıştırın.

const EMAIL_CONFIG = {
    to: 'yalcinbaris548@gmail.com',
    from: 'yalcinbaris548@gmail.com',
    appPassword: 'BURAYA_APP_PASSWORD_YAZIN'  // ← Google App Password buraya
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_CONFIG.from,
        pass: EMAIL_CONFIG.appPassword
    }
});

async function sendEmailNotification(subject, htmlContent) {
    try {
        await transporter.sendMail({
            from: `"CV Web Sitesi" <${EMAIL_CONFIG.from}>`,
            to: EMAIL_CONFIG.to,
            subject: subject,
            html: htmlContent
        });
        console.log(`  ✉️  E-posta gönderildi: ${subject}`);
    } catch (err) {
        console.log(`  ⚠️  E-posta gönderilemedi: ${err.message}`);
    }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Ana sayfa için açık rota (Render / Cloud uyumu için)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================
// DATABASE HELPERS
// ============================

function readDB() {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        const defaultDB = {
            messages: [],
            contacts: [],
            visitors: { totalVisits: 0, lastReset: new Date().toISOString().split('T')[0] }
        };
        writeDB(defaultDB);
        return defaultDB;
    }
}

function writeDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// ============================
// API ROUTES
// ============================

// --- Ziyaretçi Sayacı ---
app.get('/api/stats', (req, res) => {
    const db = readDB();
    db.visitors.totalVisits++;
    writeDB(db);
    res.json({
        success: true,
        data: {
            totalVisits: db.visitors.totalVisits,
            totalMessages: db.messages.length,
            totalContacts: db.contacts.length
        }
    });
});

// --- Ziyaretçi Defteri (Guestbook) ---

// Tüm mesajları getir
app.get('/api/messages', (req, res) => {
    const db = readDB();
    const messages = db.messages.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ success: true, data: messages });
});

// Yeni mesaj ekle
app.post('/api/messages', (req, res) => {
    const { name, message } = req.body;

    if (!name || !message) {
        return res.status(400).json({ success: false, error: 'İsim ve mesaj alanları zorunludur.' });
    }

    if (name.trim().length < 2) {
        return res.status(400).json({ success: false, error: 'İsim en az 2 karakter olmalıdır.' });
    }

    if (message.trim().length < 3) {
        return res.status(400).json({ success: false, error: 'Mesaj en az 3 karakter olmalıdır.' });
    }

    const db = readDB();
    const newMessage = {
        id: uuidv4(),
        name: name.trim(),
        message: message.trim(),
        date: new Date().toISOString(),
        avatar: name.trim().charAt(0).toUpperCase()
    };

    db.messages.push(newMessage);
    writeDB(db);

    // E-posta bildirimi gönder
    sendEmailNotification(
        `📝 Yeni Ziyaretçi Defteri Mesajı — ${newMessage.name}`,
        `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;background:#1a1a2e;color:#f0f0f5;border-radius:12px;">
            <h2 style="color:#ec4899;">📝 Yeni Ziyaretçi Mesajı</h2>
            <p><strong>İsim:</strong> ${newMessage.name}</p>
            <p><strong>Mesaj:</strong> ${newMessage.message}</p>
            <p style="color:#888;font-size:12px;">Tarih: ${new Date(newMessage.date).toLocaleString('tr-TR')}</p>
        </div>`
    );

    res.status(201).json({ success: true, data: newMessage });
});

// Mesaj sil
app.delete('/api/messages/:id', (req, res) => {
    const db = readDB();
    const index = db.messages.findIndex(m => m.id === req.params.id);

    if (index === -1) {
        return res.status(404).json({ success: false, error: 'Mesaj bulunamadı.' });
    }

    db.messages.splice(index, 1);
    writeDB(db);

    res.json({ success: true, message: 'Mesaj silindi.' });
});

// --- İletişim Formu ---

// Tüm iletişim mesajlarını getir
app.get('/api/contact', (req, res) => {
    const db = readDB();
    const contacts = db.contacts.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ success: true, data: contacts });
});

// Yeni iletişim mesajı gönder
app.post('/api/contact', (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ success: false, error: 'İsim, e-posta ve mesaj alanları zorunludur.' });
    }

    // Basit email doğrulama
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, error: 'Geçerli bir e-posta adresi giriniz.' });
    }

    const db = readDB();
    const newContact = {
        id: uuidv4(),
        name: name.trim(),
        email: email.trim(),
        subject: subject ? subject.trim() : 'Konu belirtilmedi',
        message: message.trim(),
        date: new Date().toISOString(),
        read: false
    };

    db.contacts.push(newContact);
    writeDB(db);

    // E-posta bildirimi gönder
    sendEmailNotification(
        `✉️ Yeni İletişim Mesajı — ${newContact.name}`,
        `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;background:#1a1a2e;color:#f0f0f5;border-radius:12px;">
            <h2 style="color:#10b981;">✉️ Yeni İletişim Mesajı</h2>
            <p><strong>İsim:</strong> ${newContact.name}</p>
            <p><strong>E-posta:</strong> ${newContact.email}</p>
            <p><strong>Konu:</strong> ${newContact.subject}</p>
            <p><strong>Mesaj:</strong> ${newContact.message}</p>
            <p style="color:#888;font-size:12px;">Tarih: ${new Date(newContact.date).toLocaleString('tr-TR')}</p>
        </div>`
    );

    res.status(201).json({ success: true, data: newContact, message: 'Mesajınız başarıyla gönderildi!' });
});

// ============================
// LOCAL IP ADDRESS FINDER
// ============================

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// ============================
// START SERVER
// ============================

app.listen(PORT, '0.0.0.0', async () => {
    const localIP = getLocalIP();
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║    🚀 Barış Yalçın CV - Server Başlatıldı!          ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log(`║  💻 Bilgisayar  : http://localhost:${PORT}              ║`);
    console.log(`║  🏠 Yerel Ağ    : http://${localIP}:${PORT}         ║`);
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║  📂 Veri Tabanı : database.json                     ║');
    console.log('║  ⚡ Durum       : Çalışıyor                         ║');
    console.log('╚══════════════════════════════════════════════════════╝');

    // Localtunnel ile farklı ağlardan erişim (sadece yerel çalışırken)
    if (!process.env.RENDER) {
        console.log('');
        console.log('  🌐 Dış ağ bağlantısı kuruluyor...');

        try {
            const tunnel = await localtunnel({
                port: PORT,
                subdomain: 'barisyalcin-cv'
            });
            console.log('');
            console.log('╔══════════════════════════════════════════════════════╗');
            console.log('║  🌍 FARKLI AĞLARDAN ERİŞİM (Telefon / Dış Ağ)     ║');
            console.log('╠══════════════════════════════════════════════════════╣');
            console.log(`║  📱 URL: ${tunnel.url}`);
            console.log('║                                                      ║');
            console.log('║  ⚠️  İlk girişte "Click to Continue" butonuna       ║');
            console.log('║     tıklamanız gerekebilir.                          ║');
            console.log('╚══════════════════════════════════════════════════════╝');

            tunnel.on('close', () => {
                console.log('  ⚠️  Tunnel kapandı. 3sn sonra yeniden bağlanılıyor...');
                setTimeout(async () => {
                    try {
                        const newTunnel = await localtunnel({ port: PORT, subdomain: 'barisyalcin-cv' });
                        console.log(`  ✅ Yeniden bağlandı: ${newTunnel.url}`);
                    } catch(e) {
                        console.log('  ⚠️  Yeniden bağlanılamadı:', e.message);
                    }
                }, 3000);
            });
        } catch (err) {
            console.log('');
            console.log('  ⚠️  Tunnel bağlantısı kurulamadı:', err.message);
            console.log(`  💡 Aynı Wi-Fi ağında telefondan erişim:`);
            console.log(`     http://${localIP}:${PORT}`);
        }
    }

    console.log('');
    console.log('  Durdurmak için: Ctrl + C');
    console.log('');
});
