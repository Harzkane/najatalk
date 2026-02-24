13:22:51.183 Running build in Washington, D.C., USA (East) – iad1
13:22:51.184 Build machine configuration: 2 cores, 8 GB
13:22:51.322 Cloning github.com/Harzkane/najatalk (Branch: main, Commit: 95275c7)
13:22:52.826 Cloning completed: 1.503s
13:22:53.102 Restored build cache from previous deployment (EtAiLD93oQJYfKorGdnsp7HBVSrF)
13:22:54.272 Running "vercel build"
13:22:54.879 Vercel CLI 50.22.0
13:22:55.356 Installing dependencies...
13:22:59.511 
13:22:59.513 added 69 packages in 4s
13:22:59.513 
13:22:59.514 177 packages are looking for funding
13:22:59.514   run `npm fund` for details
13:22:59.552 Detected Next.js version: 15.1.11
13:22:59.557 Running "npm run build"
13:22:59.674 
13:22:59.675 > frontend@0.1.0 build
13:22:59.675 > next build
13:22:59.675 
13:23:00.491    ▲ Next.js 15.1.11
13:23:00.492 
13:23:00.509    Creating an optimized production build ...
13:23:15.014  ✓ Compiled successfully
13:23:15.017    Skipping linting
13:23:15.017    Checking validity of types ...
13:23:23.369 Failed to compile.
13:23:23.370 
13:23:23.370 ./src/components/threads/RichTextEditor.tsx:154:53
13:23:23.371 Type error: Unexpected token. Did you mean `{'>'}` or `&gt;`?
13:23:23.371 
13:23:23.371 [0m [90m 152 |[39m         [33m<[39m[33m/[39m[33mdiv[39m[33m>[39m[0m
13:23:23.371 [0m [90m 153 |[39m         [33m<[39m[33mspan[39m className[33m=[39m[32m"text-[11px] text-slate-500"[39m[33m>[39m[0m
13:23:23.372 [0m[31m[1m>[22m[39m[90m 154 |[39m           [33mSupports[39m markdown[33m:[39m [32m`**bold**`[39m[33m,[39m [32m`- list`[39m[33m,[39m [32m`> quote`[39m[33m,[39m [32m`[link](url)`[39m[0m
13:23:23.372 [0m [90m     |[39m                                                     [31m[1m^[22m[39m[0m
13:23:23.372 [0m [90m 155 |[39m         [33m<[39m[33m/[39m[33mspan[39m[33m>[39m[0m
13:23:23.373 [0m [90m 156 |[39m       [33m<[39m[33m/[39m[33mdiv[39m[33m>[39m[0m
13:23:23.373 [0m [90m 157 |[39m[0m
13:23:23.408 Next.js build worker exited with code: 1 and signal: null
13:23:23.417 npm error Lifecycle script `build` failed with error:
13:23:23.418 npm error code 1
13:23:23.419 npm error path /vercel/path0/frontend
13:23:23.419 npm error workspace frontend@0.1.0
13:23:23.420 npm error location /vercel/path0/frontend
13:23:23.420 npm error command failed
13:23:23.420 npm error command sh -c next build
13:23:23.432 Error: Command "npm run build" exited with 1