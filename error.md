18:41:28.510 Running build in Washington, D.C., USA (East) – iad1
18:41:28.511 Build machine configuration: 2 cores, 8 GB
18:41:28.619 Cloning github.com/Harzkane/najatalk (Branch: main, Commit: 6eccc32)
18:41:28.620 Previous build caches not available.
18:41:28.852 Cloning completed: 233.000ms
18:41:29.202 Running "vercel build"
18:41:29.807 Vercel CLI 50.18.2
18:41:30.426 Running "install" command: `npm install --prefix=..`...
18:41:42.111 
18:41:42.112 added 179 packages, and audited 182 packages in 11s
18:41:42.113 
18:41:42.113 33 packages are looking for funding
18:41:42.113   run `npm fund` for details
18:41:42.206 
18:41:42.207 9 vulnerabilities (1 moderate, 6 high, 2 critical)
18:41:42.208 
18:41:42.208 To address issues that do not require attention, run:
18:41:42.208   npm audit fix
18:41:42.209 
18:41:42.209 To address all issues (including breaking changes), run:
18:41:42.209   npm audit fix --force
18:41:42.210 
18:41:42.210 Run `npm audit` for details.
18:41:42.399 Running "npm run build"
18:41:42.517 
18:41:42.517 > frontend@0.1.0 build
18:41:42.517 > next build
18:41:42.518 
18:41:43.077 Attention: Next.js now collects completely anonymous telemetry regarding usage.
18:41:43.077 This information is used to shape Next.js' roadmap and prioritize features.
18:41:43.078 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
18:41:43.078 https://nextjs.org/telemetry
18:41:43.078 
18:41:43.140    ▲ Next.js 15.1.7
18:41:43.141 
18:41:43.154    Creating an optimized production build ...
18:41:48.659 Failed to compile.
18:41:48.660 
18:41:48.660 src/app/layout.tsx
18:41:48.661 An error occurred in `next/font`.
18:41:48.662 
18:41:48.662 Error: Cannot find module 'tailwindcss'
18:41:48.663 Require stack:
18:41:48.663 - /vercel/path0/node_modules/next/dist/build/webpack/config/blocks/css/plugins.js
18:41:48.664 - /vercel/path0/node_modules/next/dist/build/webpack/config/blocks/css/index.js
18:41:48.664 - /vercel/path0/node_modules/next/dist/build/webpack/config/index.js
18:41:48.664 - /vercel/path0/node_modules/next/dist/build/webpack-config.js
18:41:48.665 - /vercel/path0/node_modules/next/dist/build/webpack-build/impl.js
18:41:48.665 - /vercel/path0/node_modules/next/dist/compiled/jest-worker/processChild.js
18:41:48.666     at Module.<anonymous> (node:internal/modules/cjs/loader:1421:15)
18:41:48.666     at /vercel/path0/node_modules/next/dist/server/require-hook.js:55:36
18:41:48.666     at require.resolve (node:internal/modules/helpers:163:19)
18:41:48.667     at loadPlugin (/vercel/path0/node_modules/next/dist/build/webpack/config/blocks/css/plugins.js:49:32)
18:41:48.667     at /vercel/path0/node_modules/next/dist/build/webpack/config/blocks/css/plugins.js:157:56
18:41:48.667     at Array.map (<anonymous>)
18:41:48.668     at getPostCssPlugins (/vercel/path0/node_modules/next/dist/build/webpack/config/blocks/css/plugins.js:157:47)
18:41:48.668     at async /vercel/path0/node_modules/next/dist/build/webpack/config/blocks/css/index.js:124:36
18:41:48.669     at async /vercel/path0/node_modules/next/dist/build/webpack/loaders/next-font-loader/index.js:86:33
18:41:48.669     at async Span.traceAsyncFn (/vercel/path0/node_modules/next/dist/trace/trace.js:153:20)
18:41:48.669 
18:41:48.670 src/app/layout.tsx
18:41:48.670 An error occurred in `next/font`.
18:41:48.670 
18:41:48.670 Error: Cannot find module 'tailwindcss'
18:41:48.670 Require stack:
18:41:48.670 - /vercel/path0/node_modules/next/dist/build/webpack/config/blocks/css/plugins.js
18:41:48.670 - /vercel/path0/node_modules/next/dist/build/webpack/config/blocks/css/index.js
18:41:48.670 - /vercel/path0/node_modules/next/dist/build/webpack/config/index.js
18:41:48.670 - /vercel/path0/node_modules/next/dist/build/webpack-config.js
18:41:48.671 - /vercel/path0/node_modules/next/dist/build/webpack-build/impl.js
18:41:48.671 - /vercel/path0/node_modules/next/dist/compiled/jest-worker/processChild.js
18:41:48.671     at Module.<anonymous> (node:internal/modules/cjs/loader:1421:15)
18:41:48.671     at /vercel/path0/node_modules/next/dist/server/require-hook.js:55:36
18:41:48.671     at require.resolve (node:internal/modules/helpers:163:19)
18:41:48.671     at loadPlugin (/vercel/path0/node_modules/next/dist/build/webpack/config/blocks/css/plugins.js:49:32)
18:41:48.671     at /vercel/path0/node_modules/next/dist/build/webpack/config/blocks/css/plugins.js:157:56
18:41:48.671     at Array.map (<anonymous>)
18:41:48.671     at getPostCssPlugins (/vercel/path0/node_modules/next/dist/build/webpack/config/blocks/css/plugins.js:157:47)
18:41:48.671     at async /vercel/path0/node_modules/next/dist/build/webpack/config/blocks/css/index.js:124:36
18:41:48.671     at async /vercel/path0/node_modules/next/dist/build/webpack/loaders/next-font-loader/index.js:86:33
18:41:48.671     at async Span.traceAsyncFn (/vercel/path0/node_modules/next/dist/trace/trace.js:153:20)
18:41:48.671 
18:41:48.671 ./src/app/(admin)/admin/page.tsx
18:41:48.671 Module not found: Can't resolve '@/utils/formatDate'
18:41:48.671 
18:41:48.671 https://nextjs.org/docs/messages/module-not-found
18:41:48.671 
18:41:48.672 ./src/app/(authenticated)/premium/page.tsx
18:41:48.672 Module not found: Can't resolve '@/components/Header'
18:41:48.677 
18:41:48.677 https://nextjs.org/docs/messages/module-not-found
18:41:48.677 
18:41:48.677 ./src/app/(authenticated)/threads/[id]/page.tsx
18:41:48.677 Module not found: Can't resolve '@/components/threads/ThreadCard'
18:41:48.677 
18:41:48.677 https://nextjs.org/docs/messages/module-not-found
18:41:48.683 
18:41:48.684 
18:41:48.685 > Build failed because of webpack errors
18:41:48.701 npm error Lifecycle script `build` failed with error:
18:41:48.701 npm error code 1
18:41:48.702 npm error path /vercel/path0/frontend
18:41:48.702 npm error workspace frontend@0.1.0
18:41:48.702 npm error location /vercel/path0/frontend
18:41:48.702 npm error command failed
18:41:48.702 npm error command sh -c next build
18:41:48.712 Error: Command "npm run build" exited with 1