# Trek Checklist

Shared trekking checklist with **live sync** between phones (Ankit & Baishakhi).

```bash
npm install
npm run dev
```

Share the PIN privately with your partner.

## Deploy on Vercel

1. Push to GitHub and import on [Vercel](https://vercel.com).
2. Deploy — no extra services required for the app to run.
3. For **two-phone live sync** on production: Vercel project → **Storage** → **Blob** → Create & connect → **Redeploy** (adds `BLOB_READ_WRITE_TOKEN` automatically).

Open the URL on both phones, sign in with your name + PIN.

## Optional

**Share backup** / **Import backup** — manual snapshot.
