/**
 * ====================================================================
 * UMBRELLA GUILD VVIP CORE MOTOR - DASHBOARD.JS
 * ENGINE VERSION: V3.0 GOLD SYNCHRONIZED
 * INTEGRASI: GAS PIPA 2 (READ) & PIPA 4 (CORE VVIP POST)
 * ====================================================================
 */

// 1. KONEKSI URL ENDPOINT (SINKRONKAN DENGAN URL EXEC GAS LU, BRE!)
const URL_PIPA_2_READ = "https://script.google.com/macros/s/AKfycbwqsSUeVxPg4V5hMc9ph92eMQ2cFqTQI7SJZOG9f-FDlPii4IaXGEfOZ7zdRG35zbIhnw/exec";
const URL_PIPA_4_CORE = "https://script.google.com/macros/s/AKfycbx1VqwGfC0Bz_tXNacdEe6s3Lu7USX9uRy7JbrOet4qu_bjA6PR9r780Ne7LP73UwUs/exec";

// State Global Dashboard
let CURRENT_ADMIN = { id: "", nama: "", role1: "", role2: "" };
let intervalChatLog = null;

// ==========================================
// [A] SEKTOR SISTEM LOGIN & AUTH
// ==========================================
function eksekusiLoginAdmin() {
    const passkeyInput = document.getElementById('admin-passkey');
    const errorMsg = document.getElementById('login-error-msg');
    const btn = document.getElementById('btn-login');
    
    const key = passkeyInput.value.trim();
    if (!key) {
        errorMsg.innerText = "⚠️ Passkey tidak boleh kosong, bre!";
        return;
    }

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> MEMBUKA GERBANG...';
    btn.disabled = true;
    errorMsg.innerText = "";

    // Tembak Pipa GAS 4 menggunakan POST JSON
    fetch(URL_PIPA_4_CORE, {
        method: "POST",
        body: JSON.stringify({
            action: "loginAdmin",
            passkey: key
        })
    })
    .then(res => res.json())
    .then(data => {
        btn.innerHTML = '<i class="fa-solid fa-door-open"></i> MASUK GERBANG';
        btn.disabled = false;

        if (data.success && data.profile) {
            // Amankan data profil ke State dan LocalStorage
            CURRENT_ADMIN = data.profile;
            localStorage.setItem('UA_ID', CURRENT_ADMIN.id);
            localStorage.setItem('UA_NAME', CURRENT_ADMIN.nama);
            localStorage.setItem('UA_ROLE', CURRENT_ADMIN.role1);
            
            // Suntikkan data ke global window agar chat.js (jika se-aplikasi) langsung ikut sinkron!
            window.myUID = CURRENT_ADMIN.id;
            window.myIGN = CURRENT_ADMIN.nama;

            // Jalankan UI Bunglon
            nyalakanDashboardVVIP();
        } else {
            errorMsg.innerText = "🚨 " + (data.message || "Passkey salah total!");
        }
    })
    .catch(err => {
        btn.innerHTML = '<i class="fa-solid fa-door-open"></i> MASUK GERBANG';
        btn.disabled = false;
        errorMsg.innerText = "🚨 Koneksi Core Terputus / Timeout!";
        console.error(err);
    });
}

// Menghidupkan Dashboard & Menyusun Hak Akses Bunglon
function nyalakanDashboardVVIP() {
    document.getElementById('gate-login-screen').style.display = 'none';
    document.getElementById('main-dashboard-layout').style.display = 'flex';
    
    // Tampilkan Nama & Badge Role di Sidebar
    document.getElementById('display-admin-name').innerText = CURRENT_ADMIN.nama;
    document.getElementById('display-admin-role').innerText = CURRENT_ADMIN.role1;

    // 🎯 LOGIKA BUNGLON: Cek Kasta Tertinggi (LEADER)
    if (CURRENT_ADMIN.role1 === "LEADER") {
        document.getElementById('leader-exclusive-nav').style.display = 'block';
    } else {
        document.getElementById('leader-exclusive-nav').style.display = 'none';
    }

    // Auto-load data pertama kali & hidupkan mesin penarik log (Interval 5 detik)
    muatLogChatDariPipa2();
    intervalChatLog = setInterval(muatLogChatDariPipa2, 5000);
}

function eksekusiLogout() {
    clearInterval(intervalChatLog);
    localStorage.clear();
    // Refresh halaman samaran lu secara otomatis
    window.location.href = "786.html";
}

// ==========================================
// [B] MANAJEMEN NAVIGASI TAB
// ==========================================
function pindahTab(targetPanelId) {
    // Matikan semua konten tab aktif
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(tab => tab.style.display = 'none');

    // Matikan semua status aktif tombol navigasi
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    // Nyalakan tab yang dituju
    document.getElementById(targetPanelId).style.display = 'block';
    
    // Cari tombol pencetusnya lalu kasih kelas aktif
    const eventBtn = event.currentTarget;
    if (eventBtn) eventBtn.classList.add('active');

    // Jika masuk ke tab Kotak Surat / Staf, opsional bisa dipicu refresh otomatis di sini
}

// ==========================================
// [C] SEKTOR MODERASI CHAT (KONEKSI PIPA 2 & 4)
// ==========================================

// Tarik data 50 chat log dari Pipa GAS 2 sekalian kirim status Online Admin!
function muatLogChatDariPipa2() {
    // Nembak Pipa GAS 2 dengan query role=admin agar status online terpicu di server cache
    fetch(`${URL_PIPA_2_READ}?role=admin&uid=${CURRENT_ADMIN.id}&ign=${encodeURIComponent(CURRENT_ADMIN.nama)}`)
    .then(res => res.json())
    .then(data => {
        if (data && data.logs) {
            renderTabelChat(data.logs);
        }
    })
    .catch(err => console.error("Gagal sinkron log chat Pipa 2:", err));
}

function renderTabelChat(logsArray) {
    const tbody = document.getElementById('table-chat-rows');
    tbody.innerHTML = '';

    // Kita balik datanya (.reverse) khusus di layar admin biar chat terbaru berada di posisi PALING ATAS tabel
    const reversedLogs = [...logsArray].reverse();

    reversedLogs.forEach((row, index) => {
        const tr = document.createElement('tr');
        
        // Atur format tampilan waktu sederhana
        const waktu = row.timestamp ? row.timestamp.substring(11, 16) : '--:--';
        
        // Deteksi Tipe Data
        let badgeType = `<span style="color:#a0aec0;">Msg</span>`;
        if (row.type && row.type.startsWith('MUTE|')) {
            badgeType = `<span style="color:#ef4444; font-weight:bold;">🚫 MUTE BLOCK</span>`;
        }

        tr.innerHTML = `
            <td>${waktu}</td>
            <td><code>${row.uid}</code></td>
            <td><b>${row.username}</b></td>
            <td>${row.message}</td>
            <td>${badgeType}</td>
            <td>
                <button class="btn-danger" style="padding:4px 8px; font-size:0.75rem;" onclick="eksekusiHapusChatBerdasarkanBaris('${index}')">
                    <i class="fa-solid fa-trash-can"></i> Hapus
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Fungsi eksekusi tombol Gavel Mute
function tembakMuteAdmin() {
    const targetInput = document.getElementById('target-mute-uid');
    const uidTarget = targetInput.value.trim();

    if (!uidTarget) {
        alert("Masukkan UID target member nakal dulu, bre!");
        return;
    }

    if (confirm(`Yakin ingin membungkam UID: ${uidTarget}? Perintah ini akan menyuntikkan kode MUTE ke sirkulasi chat!`)) {
        fetch(URL_PIPA_4_CORE, {
            method: "POST",
            body: JSON.stringify({
                action: "executeMuteAdmin",
                adminId: CURRENT_ADMIN.id,
                targetMemberUid: uidTarget
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                targetInput.value = '';
                muatLogChatDariPipa2(); // langsung paksa sync ulang chatbox
            } else {
                alert("Gagal eksekusi: " + data.message);
            }
        });
    }
}

// ==========================================
// [D] AUTO-RESTORE STATUS LOGIN (PENCEGAH KICK REFRESH)
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    const savedId = localStorage.getItem('UA_ID');
    const savedNama = localStorage.getItem('UA_NAME');
    const savedRole = localStorage.getItem('UA_ROLE');

    if (savedId && savedNama && savedRole) {
        CURRENT_ADMIN = { id: savedId, nama: savedNama, role1: savedRole, role2: "" };
        window.myUID = savedId;
        window.myIGN = savedNama;
        nyalakanDashboardVVIP();
    }
});
