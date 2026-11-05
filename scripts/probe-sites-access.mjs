const origin = new URL(process.argv[2]);
if (origin.protocol !== 'https:' || !origin.hostname.endsWith('.chatgpt.site')) throw new Error('Expected a Sites HTTPS origin.');
let failed = false;
for (const forged of [false, true]) {
  for (const path of ['/catalog.json', '/assets/essential.txt']) {
    const response = await fetch(new URL(path, origin), {
      redirect: 'manual',
      headers: forged ? { 'oai-authenticated-user-id': 'synthetic-forged-identity' } : {},
    });
    const body = await response.text();
    const blocked = [301, 302, 303, 307, 308, 401, 403].includes(response.status) &&
      !/synthetic-release-1|Fictional essential asset/.test(body);
    failed ||= !blocked;
    console.log(JSON.stringify({ path, forgedIdentity: forged, status: response.status, protectedPayloadBlocked: blocked }));
  }
}
if (failed) process.exitCode = 1;
