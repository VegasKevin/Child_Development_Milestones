const page = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Milestones - invitation access test</title>
    <style>
      :root { color-scheme: light; font-family: 'Trebuchet MS', sans-serif; color: #181818; background: #f5f5f5; }
      html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      body { display: grid; min-height: 100vh; margin: 0; place-items: center; }
      main { max-width: 30rem; margin: 1rem; padding: 2rem; background: white; border-radius: 1.5rem; }
      h1 { font-size: clamp(2rem, 8vw, 3rem); line-height: 1.1; }
      p { line-height: 1.6; }
      a { display: block; padding: 1rem; background: #c6f334; border-radius: .7rem; color: #181818; font-weight: bold; }
      a:focus-visible { outline: 3px solid #2855a0; outline-offset: 4px; }
      .notice { border-left: .4rem solid #a796f4; padding-left: 1rem; }
    </style>
  </head>
  <body>
    <main>
      <h1>A little guide.<br>An invitation first.</h1>
      <p>This private test checks access to a milestone guide. It contains fictional engineering content only.</p>
      <p class="notice">An invitation is required. This candidate currently uses Sites account sign-in; email verification is not implemented yet.</p>
      <a href="/catalog.json">Check access to the test catalog</a>
    </main>
  </body>
</html>`;

export default {
  async fetch(request, env, ctx) {
    void env;
    void ctx;

    const path = new URL(request.url).pathname;
    const headers = { 'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff',
      'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'" };
    if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 405, headers: { ...headers, allow: 'GET, HEAD' } });
    let body, type;
    if (path === '/') {
      body = page; type = 'text/html; charset=utf-8';
    } else if (path === '/catalog.json' || path === '/assets/essential.txt') {
      // This header is trusted ONLY behind Sites dispatch and its owner-private access policy.
      // Never deploy this adapter as a standalone server accepting client-supplied identity headers.
      if (!request.headers.get('oai-authenticated-user-id')?.trim()) return new Response(null, { status: 401, headers });
      body = path === '/catalog.json' ? JSON.stringify({ id: 'synthetic-release-1', summary: 'Access-test payload only; not a complete catalog.' })
        : 'Fictional essential asset for access testing only.';
      type = path === '/catalog.json' ? 'application/json' : 'text/plain; charset=utf-8';
    } else return new Response(null, { status: 404, headers });
    return new Response(request.method === 'HEAD' ? null : body, { headers: { ...headers, 'content-type': type } });
  },
};
