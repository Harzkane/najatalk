19:28:11.207 Running build in Washington, D.C., USA (East) – iad1
19:28:11.208 Build machine configuration: 2 cores, 8 GB
19:28:11.219 Cloning github.com/Harzkane/najatalk (Branch: main, Commit: 5c0955f)
19:28:11.220 Skipping build cache, deployment was triggered without cache.
19:28:11.464 Cloning completed: 244.000ms
19:28:11.898 Running "vercel build"
19:28:12.547 Vercel CLI 50.18.2
19:28:13.128 Running "install" command: `npm install --prefix=..`...
19:28:30.231 npm warn deprecated next@15.1.9: This version has a security vulnerability. Please upgrade to a patched version. See https://nextjs.org/blog/security-update-2025-12-11 for more details.
19:28:30.565 
19:28:30.565 added 287 packages, and audited 290 packages in 17s
19:28:30.566 
19:28:30.567 62 packages are looking for funding
19:28:30.567   run `npm fund` for details
19:28:30.656 
19:28:30.657 12 vulnerabilities (1 low, 1 moderate, 8 high, 2 critical)
19:28:30.658 
19:28:30.659 To address issues that do not require attention, run:
19:28:30.662   npm audit fix
19:28:30.662 
19:28:30.662 To address all issues (including breaking changes), run:
19:28:30.662   npm audit fix --force
19:28:30.662 
19:28:30.662 Run `npm audit` for details.
19:28:30.834 Running "npm run build"
19:28:30.953 
19:28:30.953 > frontend@0.1.0 build
19:28:30.954 > next build
19:28:30.954 
19:28:31.520 Attention: Next.js now collects completely anonymous telemetry regarding usage.
19:28:31.521 This information is used to shape Next.js' roadmap and prioritize features.
19:28:31.521 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
19:28:31.521 https://nextjs.org/telemetry
19:28:31.522 
19:28:31.589    ▲ Next.js 15.1.9
19:28:31.590 
19:28:31.604    Creating an optimized production build ...
19:28:36.396 Failed to compile.
19:28:36.396 
19:28:36.396 ./src/app/(admin)/admin/page.tsx
19:28:36.396 Module not found: Can't resolve '@/utils/formatDate'
19:28:36.396 
19:28:36.396 https://nextjs.org/docs/messages/module-not-found
19:28:36.396 
19:28:36.397 ./src/app/(authenticated)/premium/page.tsx
19:28:36.397 Module not found: Can't resolve '@/components/Header'
19:28:36.397 
19:28:36.397 https://nextjs.org/docs/messages/module-not-found
19:28:36.397 
19:28:36.397 ./src/app/(authenticated)/threads/[id]/page.tsx
19:28:36.397 Module not found: Can't resolve '@/components/threads/ThreadCard'
19:28:36.398 
19:28:36.398 https://nextjs.org/docs/messages/module-not-found
19:28:36.398 
19:28:36.398 ./src/app/(authenticated)/threads/[id]/page.tsx
19:28:36.398 Module not found: Can't resolve '@/utils/formatDate'
19:28:36.399 
19:28:36.399 https://nextjs.org/docs/messages/module-not-found
19:28:36.399 
19:28:36.399 ./src/app/(authenticated)/threads/page.tsx
19:28:36.400 Module not found: Can't resolve '@/components/threads/ThreadCard'
19:28:36.400 
19:28:36.400 https://nextjs.org/docs/messages/module-not-found
19:28:36.401 
19:28:36.403 
19:28:36.404 > Build failed because of webpack errors
19:28:36.419 npm error Lifecycle script `build` failed with error:
19:28:36.420 npm error code 1
19:28:36.421 npm error path /vercel/path0/frontend
19:28:36.422 npm error workspace frontend@0.1.0
19:28:36.422 npm error location /vercel/path0/frontend
19:28:36.423 npm error command failed
19:28:36.424 npm error command sh -c next build
19:28:36.436 Error: Command "npm run build" exited with 1