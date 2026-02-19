20:09:30.918 Running build in Washington, D.C., USA (East) – iad1
20:09:30.919 Build machine configuration: 2 cores, 8 GB
20:09:31.041 Cloning github.com/Harzkane/najatalk (Branch: main, Commit: b42e8c1)
20:09:31.632 Cloning completed: 591.000ms
20:09:31.962 Restored build cache from previous deployment (EyLSUnkZ5NAz9zRd2Kr8d9y4mu2F)
20:09:32.259 Running "vercel build"
20:09:32.819 Vercel CLI 50.18.2
20:09:33.372 Running "install" command: `npm install`...
20:09:46.457 
20:09:46.459 removed 234 packages, changed 2 packages, and audited 298 packages in 13s
20:09:46.459 
20:09:46.460 61 packages are looking for funding
20:09:46.460   run `npm fund` for details
20:09:46.533 
20:09:46.533 6 vulnerabilities (1 low, 3 high, 2 critical)
20:09:46.534 
20:09:46.535 To address issues that do not require attention, run:
20:09:46.535   npm audit fix
20:09:46.535 
20:09:46.535 To address all issues, run:
20:09:46.536   npm audit fix --force
20:09:46.536 
20:09:46.536 Run `npm audit` for details.
20:09:46.726 Running "npm run build"
20:09:46.845 
20:09:46.846 > frontend@0.1.0 build
20:09:46.846 > next build
20:09:46.846 
20:09:47.493 Attention: Next.js now collects completely anonymous telemetry regarding usage.
20:09:47.493 This information is used to shape Next.js' roadmap and prioritize features.
20:09:47.493 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
20:09:47.493 https://nextjs.org/telemetry
20:09:47.494 
20:09:47.586    ▲ Next.js 15.1.11
20:09:47.590 
20:09:47.721    Creating an optimized production build ...
20:09:58.947  ✓ Compiled successfully
20:09:58.950    Skipping linting
20:09:58.950    Checking validity of types ...
20:09:59.245 It looks like you're trying to use TypeScript but do not have the required package(s) installed.
20:09:59.245 
20:09:59.246 Please install typescript, @types/react, and @types/node by running:
20:09:59.246 
20:09:59.246 	yarn add --dev typescript @types/react @types/node
20:09:59.247 
20:09:59.247 If you are not trying to use TypeScript, please remove the tsconfig.json file from your package root (and any TypeScript files in your app and pages directories).
20:09:59.247 
20:09:59.253 Next.js build worker exited with code: 1 and signal: null
20:09:59.265 npm error Lifecycle script `build` failed with error:
20:09:59.266 npm error code 1
20:09:59.266 npm error path /vercel/path0/frontend
20:09:59.266 npm error workspace frontend@0.1.0
20:09:59.266 npm error location /vercel/path0/frontend
20:09:59.267 npm error command failed
20:09:59.267 npm error command sh -c next build
20:09:59.275 Error: Command "npm run build" exited with 1