// Polyfill-style fetch logger: wrap global fetch to log requests/responses with correlation id
const generateCorrelationId = () => {
  try {
    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
      return (crypto as any).randomUUID();
    }
  } catch (e) {
    // ignore
  }
  return `cid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
};

const maskAuthHeader = (headersInit: HeadersInit | undefined) => {
  if (!headersInit) return headersInit;
  // Normalize to object
  const obj: Record<string, any> = {};
  if (headersInit instanceof Headers) {
    (headersInit as Headers).forEach((v, k) => (obj[k] = v));
  } else if (Array.isArray(headersInit)) {
    (headersInit as Array<any>).forEach(([k, v]) => (obj[k] = v));
  } else {
    Object.assign(obj, headersInit as Record<string, any>);
  }
  if (obj.Authorization) obj.Authorization = 'REDACTED';
  if (obj.authorization) obj.authorization = 'REDACTED';
  return obj;
};

export default function initFetchLogger() {
  if (typeof window === 'undefined') return; // only client
  if (!window.fetch) return;

  // Respect runtime flag: NEXT_PUBLIC_ENABLE_HTTP_LOGS
  try {
    // process.env.NEXT_PUBLIC_ENABLE_HTTP_LOGS is replaced at build time
    if (process.env.NEXT_PUBLIC_ENABLE_HTTP_LOGS !== 'true') return;
  } catch (e) {
    // ignore and proceed only if flag present
    return;
  }

  if ((window as any).__fetchLoggerInstalled) return;
  (window as any).__fetchLoggerInstalled = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit | undefined) => {
    const url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input as Request).url);
    const method = (init?.method || (typeof input === 'object' && 'method' in input ? (input as Request).method : 'GET')).toLowerCase();
    const correlationId = (init?.headers && ((init.headers as any)['X-Correlation-Id'] || (init.headers as any)['x-correlation-id'])) || generateCorrelationId();

    try {
      console.log(JSON.stringify({
        type: 'fetch:request',
        correlationId,
        method,
        url,
        headers: maskAuthHeader(init?.headers),
        body: init?.body,
        ts: new Date().toISOString(),
      }));
    } catch (e) {}

    const start = Date.now();
    const response = await originalFetch(input, init);
    const duration = Date.now() - start;

    let responseBody: any = null;
    try {
      const clone = response.clone();
      const ct = clone.headers.get('content-type') || '';
      if (ct.includes('application/json')) responseBody = await clone.json();
      else responseBody = await clone.text();
    } catch (e: any) {
      responseBody = `Unable to read response body: ${e?.message || e}`;
    }

    try {
      console.log(JSON.stringify({
        type: 'fetch:response',
        correlationId,
        method,
        url,
        status: response.status,
        duration,
        responseHeaders: Array.from(response.headers.entries()),
        responseBody,
        ts: new Date().toISOString(),
      }));
    } catch (e) {}

    return response;
  };
}
