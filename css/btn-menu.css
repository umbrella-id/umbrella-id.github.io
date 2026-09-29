/* ==========================================
   btn-menu.css — Tombol Menu Kiri & Kanan
   ========================================== */

.btn-wrap {
  position: absolute;
  top: 0;
  width: 180px;
  height: 72px;
  cursor: pointer;
  transition: transform 0.3s ease;
}
.btn-wrap.kiri-atas { top: 0; left: 0; }
.btn-wrap.kanan-atas { top: 0; right: 0; }

.btn-wrap svg {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.btn-wrap .svg-ornamen { top: 0; left: 0; }
.btn-wrap .svg-tombol {
  top: 50%;
  left: 50%;
  width: 70%;
  height: 70%;
  transform: translate(-50%, -50%);
  transform-origin: center;
  transition: transform 0.1s ease, filter 0.15s ease;
}
.btn-wrap:hover .svg-tombol { transform: translate(-50%, -52%); }
.btn-wrap:active .svg-tombol {
  transform: translate(-50%, -48%) scale(0.95);
  filter: brightness(0.75);
}

.ikon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 3;
  transition: transform 0.1s ease;
}
.ikon img,
.ikon svg {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.8));
}
.btn-wrap:active .ikon {
  transform: translate(-50%, -50%) scale(0.9);
}

/* Responsif */
@media (max-aspect-ratio: 22/10) {
  .btn-wrap.kiri-atas { transform: translateX(-30%); }
  .btn-wrap.kanan-atas { transform: translateX(30%); }
}

/* ==========================================
   MODE GANTI NAMA (gate-edit-mode)
   ========================================== */

/* Tombol kiri: naikkan z-index di atas overlay gate */
.stage.gate-edit-mode .btn-wrap.kiri-atas {
  z-index: 950;
}

/* Plat nama: sembunyikan */
.stage.gate-edit-mode .plat-nama {
  display: none !important;
}

/* Tombol kanan: sembunyikan */
.stage.gate-edit-mode .btn-wrap.kanan-atas {
  display: none !important;
}
