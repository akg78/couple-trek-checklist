# Trek Checklist

Private mobile checklist for a Himalayan trek. Data stays in the browser (`localStorage`).

```bash
npm install
cp .env.example .env
# Set NUXT_TREK_PIN in .env (6 digits), then:
npm run dev
```

**Deploy (Vercel):** import the GitHub repo → add **`NUXT_TREK_PIN`** (6 digits; `TREK_PIN` also works) → **Redeploy**. Share the link and PIN only with your travel partner.

**Sync between phones:** Share backup → WhatsApp → Import backup on the other device.
