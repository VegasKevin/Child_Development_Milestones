# Private Sites access candidate

This synthetic POC-01 candidate tests direct catalog and essential-asset access behind Sites dispatch.
It is not a complete guide, CDC catalog, email-verification flow or offline app.
Trust the identity header only on Sites with the owner-private platform policy intact.
Do not run this adapter as an independently exposed server that accepts client-supplied identity headers.
No test email or credentials belong in source.

Use `npm.cmd run build` and `npm.cmd run validate` on Windows.
The portable build script is `scripts/build.mjs`; the retained shell script is an equivalent starter build for environments with Bash.

The following describes the retained Worker starter artifact layout.

Use this starter for a static microsite, click counter, or simple internal UI whose state is browser-scoped. It has no dependencies and needs no install.

Edit `worker/index.js`, then publish through the Sites hosting workflow with this starter's build and validation in `commands`.

The build copies only `worker/index.js` and `.openai/hosting.json`. Do not add standalone asset files. Embed any essential raster bytes in `worker/index.js` and serve or reference them as a data URL.

Pass these argument arrays as `commands`:

```json
[
  ["bash", "scripts/build.sh"],
  ["node", "scripts/validate-artifact.mjs"]
]
```

The deterministic build produces:

```text
dist/
├── .openai/
│   └── hosting.json
└── server/
    └── index.js
```

`dist/server/index.js` is an ES module with a default export containing `fetch(request, env, ctx)`. Edit `worker/index.js`, not the generated file under `dist/`.
