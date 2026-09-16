# ApplyDesk

ApplyDesk is a dynamic React job-search app that loads live remote job listings from Remotive, lets users search roles, save jobs, open real application links, and track application status locally in the browser.

## Live Jobs

The app fetches jobs from the public Remotive jobs API at runtime. No API key is required.

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deployment

This repository includes a GitHub Actions workflow at `.github/workflows/deploy.yml` that builds the Vite app and deploys `dist` to GitHub Pages whenever `main` is updated.
