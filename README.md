# BankOps AI — Frontend

Banka ödeme operasyonları için yapay zekâ destekli istisna yönetimi ve karar destek platformunun arayüzü.
Backend: [bankops-ai-backend](https://github.com/dilaraymercann/bankops-ai-backend)

> Tüm veriler **sentetiktir**. Uygulama gerçek bankacılık işlemi yapmaz.

## Teknolojiler

React 19 · TypeScript · Vite · Tailwind CSS 4 · shadcn/ui

## Gereksinimler

- Node.js 26 (`.nvmrc` dosyasında tanımlı; nvm kullanıyorsan `nvm use`)

## Çalıştırma

```bash
npm install
npm run dev
```

Uygulama http://localhost:5173 adresinde açılır. Backend'in de çalışıyor olması gerekir (varsayılan adres `http://localhost:8080`; değiştirmek için `.env.example` dosyasını `.env` olarak kopyalayıp `VITE_API_BASE_URL` ayarlanır). Giriş yapmak için demo kullanıcı adları ve parola backend README'sinde anlatılır.

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu (hot reload) |
| `npm run build` | Tip kontrolü + üretim derlemesi (`dist/`) |
| `npm run lint` | Kod kontrolü (oxlint) |

## Tasarım

Ekran taslakları: [docs/design](docs/design)

Ayrıntılı proje rehberi: [CLAUDE.md](CLAUDE.md)
