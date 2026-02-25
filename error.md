02:52:27.893 Running build in Washington, D.C., USA (East) – iad1
02:52:27.894 Build machine configuration: 2 cores, 8 GB
02:52:28.034 Cloning github.com/Harzkane/najatalk (Branch: main, Commit: 20f7325)
02:52:29.458 Cloning completed: 1.422s
02:52:29.940 Restored build cache from previous deployment (CUMpJD6NYqk44Hwxe3NcdC2Rv6iC)
02:52:31.074 Running "vercel build"
02:52:31.786 Vercel CLI 50.23.0
02:52:32.071 Installing dependencies...
02:52:33.435 
02:52:33.439 up to date in 1s
02:52:33.440 
02:52:33.440 177 packages are looking for funding
02:52:33.441   run `npm fund` for details
02:52:33.468 Detected Next.js version: 15.1.11
02:52:33.472 Running "npm run build"
02:52:33.589 
02:52:33.590 > frontend@0.1.0 build
02:52:33.590 > next build
02:52:33.590 
02:52:34.446    ▲ Next.js 15.1.11
02:52:34.447 
02:52:34.464    Creating an optimized production build ...
02:52:46.482  ✓ Compiled successfully
02:52:46.484    Skipping linting
02:52:46.485    Checking validity of types ...
02:52:55.147    Collecting page data ...
02:52:58.377    Generating static pages (0/24) ...
02:52:59.375  ⨯ useSearchParams() should be wrapped in a suspense boundary at page "/login". Read more: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
02:52:59.376     at i (/vercel/path0/frontend/.next/server/chunks/745.js:1:41531)
02:52:59.377     at p (/vercel/path0/frontend/.next/server/chunks/745.js:1:58124)
02:52:59.377     at h (/vercel/path0/frontend/.next/server/app/(auth)/login/page.js:1:3380)
02:52:59.378     at nO (/vercel/path0/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:20:45959)
02:52:59.378     at nI (/vercel/path0/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:20:47734)
02:52:59.378     at nL (/vercel/path0/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:20:65533)
02:52:59.379     at nN (/vercel/path0/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:20:63164)
02:52:59.379     at n$ (/vercel/path0/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:20:46311)
02:52:59.379     at nI (/vercel/path0/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:20:47780)
02:52:59.379     at nI (/vercel/path0/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:20:62515)
02:52:59.380 Error occurred prerendering page "/login". Read more: https://nextjs.org/docs/messages/prerender-error
02:52:59.380 Export encountered an error on /(auth)/login/page: /login, exiting the build.
02:52:59.383  ⨯ Next.js build worker exited with code: 1 and signal: null
02:52:59.410 npm error Lifecycle script `build` failed with error:
02:52:59.410 npm error code 1
02:52:59.410 npm error path /vercel/path0/frontend
02:52:59.413 npm error workspace frontend@0.1.0
02:52:59.413 npm error location /vercel/path0/frontend
02:52:59.413 npm error command failed
02:52:59.413 npm error command sh -c next build
02:52:59.427 Error: Command "npm run build" exited with 1