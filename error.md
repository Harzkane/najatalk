19:39:23.819 Running build in Washington, D.C., USA (East) – iad1
19:39:23.820 Build machine configuration: 2 cores, 8 GB
19:39:23.935 Cloning github.com/Harzkane/najatalk (Branch: main, Commit: a459d17)
19:39:24.168 Cloning completed: 233.000ms
19:39:27.741 Restored build cache from previous deployment (EyLSUnkZ5NAz9zRd2Kr8d9y4mu2F)
19:39:28.027 Running "vercel build"
19:39:28.638 Vercel CLI 50.18.2
19:39:29.205 Running "install" command: `npm install --prefix=..`...
19:39:42.969 
19:39:42.969 removed 244 packages, changed 2 packages, and audited 288 packages in 14s
19:39:42.969 
19:39:42.969 60 packages are looking for funding
19:39:42.969   run `npm fund` for details
19:39:43.036 
19:39:43.037 12 vulnerabilities (1 low, 1 moderate, 8 high, 2 critical)
19:39:43.038 
19:39:43.038 To address issues that do not require attention, run:
19:39:43.039   npm audit fix
19:39:43.039 
19:39:43.039 To address all issues (including breaking changes), run:
19:39:43.040   npm audit fix --force
19:39:43.040 
19:39:43.040 Run `npm audit` for details.
19:39:43.191 Running "npm run build"
19:39:43.350 
19:39:43.350 > frontend@0.1.0 build
19:39:43.351 > next build
19:39:43.351 
19:39:44.005 Attention: Next.js now collects completely anonymous telemetry regarding usage.
19:39:44.006 This information is used to shape Next.js' roadmap and prioritize features.
19:39:44.006 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
19:39:44.007 https://nextjs.org/telemetry
19:39:44.007 
19:39:44.070    ▲ Next.js 15.1.12
19:39:44.070 
19:39:44.189    Creating an optimized production build ...
19:39:49.294 Failed to compile.
19:39:49.294 
19:39:49.294 ./src/app/(admin)/admin/page.tsx
19:39:49.295 Module not found: Can't resolve '@/utils/formatDate'
19:39:49.295 
19:39:49.295 https://nextjs.org/docs/messages/module-not-found
19:39:49.295 
19:39:49.295 ./src/app/(authenticated)/premium/page.tsx
19:39:49.295 Module not found: Can't resolve '@/components/Header'
19:39:49.295 
19:39:49.295 https://nextjs.org/docs/messages/module-not-found
19:39:49.296 
19:39:49.296 ./src/app/(authenticated)/threads/[id]/page.tsx
19:39:49.296 Module not found: Can't resolve '@/components/threads/ThreadCard'
19:39:49.296 
19:39:49.296 https://nextjs.org/docs/messages/module-not-found
19:39:49.296 
19:39:49.296 ./src/app/(authenticated)/threads/[id]/page.tsx
19:39:49.297 Module not found: Can't resolve '@/utils/formatDate'
19:39:49.297 
19:39:49.297 https://nextjs.org/docs/messages/module-not-found
19:39:49.297 
19:39:49.297 ./src/app/(authenticated)/threads/page.tsx
19:39:49.297 Module not found: Can't resolve '@/components/threads/ThreadCard'
19:39:49.297 
19:39:49.297 https://nextjs.org/docs/messages/module-not-found
19:39:49.298 
19:39:49.300 
19:39:49.301 > Build failed because of webpack errors
19:39:49.318 npm error Lifecycle script `build` failed with error:
19:39:49.318 npm error code 1
19:39:49.319 npm error path /vercel/path0/frontend
19:39:49.320 npm error workspace frontend@0.1.0
19:39:49.320 npm error location /vercel/path0/frontend
19:39:49.320 npm error command failed
19:39:49.321 npm error command sh -c next build
19:39:49.330 Error: Command "npm run build" exited with 1