# Laison Recap - Sistem Inventaris IoT

Aplikasi web modern untuk merekap dan mengelola data perangkat **Laison** (LoRaWAN & NB-IoT), menggantikan pencatatan manual spreadsheet Excel.

---

## 🚀 Cara Paling Mudah Membuka Aplikasi

Anda tidak perlu membuka terminal ataupun mengetik perintah yang rumit:

### Opsi 1 (Paling Cepat - 1 Kali Klik):
- Cukup **double-click** file **`Buka_Aplikasi.bat`** di folder ini.
- Aplikasi akan langsung otomatis terbuka di browser Chrome / Microsoft Edge Anda.

### Opsi 2 (Langsung Buka File HTML):
- **Double-click** file **`Laison_Device_Recap_Offline.html`** (atau `AquaLink_Device_Recap_Offline.html`).
- File ini adalah file mandiri (*standalone single-file*) yang sudah menyertakan seluruh sistem, tampilan, dan 80 data perangkat resmi dari Excel Anda tanpa butuh koneksi internet.

### Opsi 3 (Mode Development Server):
Jika Anda ingin menjalankan dev server lokal:
```bash
npm run dev
```
Lalu buka di browser: `http://localhost:5173/`

---

## 📊 Data Perangkat yang Ditampilkan (Sesuai Excel)

Sesuai permintaan Anda, seluruh kolom yang tidak penting telah dibersihkan sehingga tabel hanya menampilkan data asli dari Excel:
1. **NO** — Nomor urut
2. **SERI** — Nomor seri unik perangkat (contoh: `6604290016`)
3. **KONEKSI** — LoRaWAN atau NB-IoT
4. **READ ADDRESS** — Alamat baca perangkat (contoh: `AF066604290016`)
5. **DEVEUI / NO SIM** — DevEUI untuk LoRaWAN / Nomor SIM untuk NB-IoT
6. **APPEUI / APN&BAND** — AppEUI untuk LoRaWAN / Konfigurasi APN & Band untuk NB-IoT
7. **DEVADDR** — Device Address untuk LoRaWAN
8. **APPKEY** — Kunci aplikasi (disediakan tombol 1-klik untuk salin)
9. **IP** — IP server tujuan untuk NB-IoT
10. **STATUS** — Status perangkat (`Terpasang`, `Stok`, `Rusak`, dll.)
11. **LOKASI** — Lokasi penempatan (P. Kelapa Dua, Bukit Asam, Env. Semarang, dll.)
12. **CATATAN** — Catatan teknis (contoh: *"Ada di kantor pak Jo"*, *"rusak"*, dll.)

---

## 🛠️ Fitur Utama

- **Catat Keluar & Kembali ke Gudang (Logistik):**
  - **Catat Keluar:** Catat tanggal keluar, lokasi pengiriman/lapangan, teknisi/PIC pembawa, keperluan, dan status unit secara instan.
  - **Catat Kembali:** Catat tanggal pengembalian ke gudang, kondisi unit (Stok normal / Rusak / Maintenance), dan lokasi rak simpan di gudang.
  - **Riwayat Pergerakan:** Riwayat lengkap keluar-masuk perangkat tersimpan rapi dan dapat dilihat di detail perangkat.
  - **Monitoring Dashboard:** Panel pemantau khusus untuk perangkat yang sedang berada di luar gudang beserta tombol cepat pengembalian.
- **Pencarian Cepat:** Cari berdasarkan seri, read address, devEUI, no sim, atau lokasi secara instan.
- **Filter Fleksibel:** Filter berdasarkan posisi gudang (Di Gudang / Di Luar), status operasional, jenis koneksi (LoRaWAN / NB-IoT), dan lokasi.
- **Tambah & Edit Device:** Form input pintar yang otomatis menyesuaikan field LoRaWAN vs NB-IoT beserta informasi logistik.
- **Duplikasi & Hapus:** Dilengkapi dialog konfirmasi keamanan agar data tidak sengaja terhapus.
- **Import Excel (.xlsx/.csv):** Preview data sebelum masuk, deteksi nomor seri duplikat, dan dukungan tanggal logistik gudang.
- **Export Excel:** Unduh rekapitulasi data kapan saja ke format `.xlsx` lengkap dengan riwayat tanggal keluar/kembali gudang.
- **Backup & Restore JSON:** Simpan cadangan seluruh database ke berkas `.json` dan pulihkan kapan saja.
- **Penyimpanan Lokal:** Seluruh data tersimpan aman di browser Anda via `localStorage` (tetap ada meski komputer direstart).
