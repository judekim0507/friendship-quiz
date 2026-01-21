# Friendship Quiz

A quiz app that matches people based on their answers for BNSS Student Gov. 

## Stack

- SvelteKit
- Tailwind v4
- Supabase
- Google Gemini API (for input matching logic)
- Resend (emails)

## Setup

```sh
pnpm install
```

Create a `.env` file with your keys:

```
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
RESEND_FROM_EMAIL=...
GEMINI_API_KEY=...
PUBLIC_BASE_URL=...
```

## Dev

```sh
pnpm dev
```

## build

```sh
pnpm build
pnpm preview
```

## how it works

1. user takes quiz
2. answers get stored in supabase (json)
3. matching logic + ai for custom input figures out compatibility
4. results emailed out
