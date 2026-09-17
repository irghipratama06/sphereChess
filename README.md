# Sphere Chess

Game catur mobile berbahasa Indonesia, melawan komputer, dengan koneksi Sphere Wallet dan tampilan papan peringkat.

## Deploy dari HP tanpa Terminal

1. Buat repository GitHub.
2. Upload semua isi folder project ini.
3. Buka Vercel.
4. Add New -> Project.
5. Import repository GitHub.
6. Application Preset: **Other**.
7. Root Directory: **./**
8. Environment Variables: kosong dulu.
9. Klik Deploy.

## Sphere

Koneksi browser menggunakan Sphere SDK, `autoConnect`, network `testnet2`, permission `identity:read` dan `sign:request`, serta wallet `https://sphere.unicity.network`.

## Catatan

Frontend ini sudah berisi permainan melawan komputer, deposit/stake UI, kredit langkah, dan leaderboard UI. Transfer UCT nyata, pencatatan deposit mingguan, perhitungan 50% prize pool, multiplayer/akun global, serta payout otomatis belum diaktifkan di frontend ini. Fitur-fitur tersebut membutuhkan backend dan settlement on-chain yang aman.


## Konversi UCT ke langkah

- 5 UCT = 100 langkah
- 10 UCT = 200 langkah
- 15 UCT = 300 langkah
- Setiap tambahan 1 UCT = 20 langkah

Rumus: **jumlah langkah = jumlah UCT × 20**.
