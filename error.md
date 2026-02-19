18:52:01.646 Running build in Washington, D.C., USA (East) – iad1
18:52:01.646 Build machine configuration: 2 cores, 8 GB
18:52:01.751 Cloning github.com/Harzkane/najatalk (Branch: main, Commit: 97e75e2)
18:52:01.752 Previous build caches not available.
18:52:02.004 Cloning completed: 253.000ms
18:52:02.355 Running "vercel build"
18:52:02.966 Vercel CLI 50.18.2
18:52:03.582 Running "install" command: `npm install --prefix=..`...
18:52:46.842 
18:52:46.843 added 530 packages, and audited 533 packages in 43s
18:52:46.843 
18:52:46.843 163 packages are looking for funding
18:52:46.843   run `npm fund` for details
18:52:47.082 
18:52:47.082 28 vulnerabilities (2 low, 3 moderate, 21 high, 2 critical)
18:52:47.083 
18:52:47.083 To address issues that do not require attention, run:
18:52:47.083   npm audit fix
18:52:47.084 
18:52:47.085 To address all issues (including breaking changes), run:
18:52:47.085   npm audit fix --force
18:52:47.086 
18:52:47.086 Run `npm audit` for details.
18:52:47.255 Running "npm run build"
18:52:47.369 
18:52:47.370 > frontend@0.1.0 build
18:52:47.370 > next build
18:52:47.370 
18:52:47.920 Attention: Next.js now collects completely anonymous telemetry regarding usage.
18:52:47.921 This information is used to shape Next.js' roadmap and prioritize features.
18:52:47.921 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
18:52:47.922 https://nextjs.org/telemetry
18:52:47.922 
18:52:47.983    ▲ Next.js 15.1.7
18:52:47.984 
18:52:47.997    Creating an optimized production build ...
18:52:59.005  ✓ Compiled successfully
18:52:59.007    Skipping linting
18:52:59.008    Checking validity of types ...
18:53:03.011    Collecting page data ...
18:53:05.544    Generating static pages (0/16) ...
18:53:06.551    Generating static pages (4/16) 
18:53:06.551    Generating static pages (8/16) 
18:53:06.551    Generating static pages (12/16) 
18:53:06.551  ✓ Generating static pages (16/16)
18:53:06.908    Finalizing page optimization ...
18:53:06.913    Collecting build traces ...
18:53:18.946 
18:53:18.950 Route (app)                              Size     First Load JS
18:53:18.951 ┌ ○ /                                    4.62 kB         134 kB
18:53:18.951 ├ ○ /_not-found                          977 B           106 kB
18:53:18.951 ├ ○ /admin                               2.63 kB         132 kB
18:53:18.952 ├ ○ /appeal                              1.51 kB         131 kB
18:53:18.952 ├ ○ /contests                            840 B           130 kB
18:53:18.952 ├ ○ /login                               1.13 kB         127 kB
18:53:18.952 ├ ○ /marketplace                         3.13 kB         132 kB
18:53:18.952 ├ ○ /marketplace/wallet                  1.69 kB         131 kB
18:53:18.953 ├ ○ /premium                             3.98 kB         133 kB
18:53:18.953 ├ ○ /premium/success                     1.47 kB         131 kB
18:53:18.953 ├ ○ /signup                              956 B           126 kB
18:53:18.953 ├ ○ /threads                             5.27 kB         138 kB
18:53:18.953 ├ ƒ /threads/[id]                        1.19 kB         134 kB
18:53:18.954 ├ ○ /tip/success                         1.25 kB         130 kB
18:53:18.954 ├ ƒ /users/[id]                          1.55 kB         131 kB
18:53:18.954 ├ ƒ /users/[id]/wallet                   1.41 kB         130 kB
18:53:18.954 └ ƒ /verify/[token]                      841 B           126 kB
18:53:18.955 + First Load JS shared by all            105 kB
18:53:18.955   ├ chunks/239-dbefd6d5f7f943eb.js       50.5 kB
18:53:18.955   ├ chunks/c7879cf7-315c184414355674.js  52.9 kB
18:53:18.955   └ other shared chunks (total)          1.9 kB
18:53:18.955 
18:53:18.956 
18:53:18.956 ○  (Static)   prerendered as static content
18:53:18.957 ƒ  (Dynamic)  server-rendered on demand
18:53:18.957 
18:53:19.023 Build Completed in /vercel/output [1m]
18:53:19.237 Error: Vulnerable version of Next.js detected, please update immediately. Learn More: https://vercel.link/CVE-2025-66478