const MAX_ERRORS_PER_SESSION = 80;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_STACK_LENGTH = 12000;
const ERROR_COUNT_KEY = 'client_error_log_count';
const SESSION_ID_KEY = 'client_error_session_id';

let supabaseClient = null;
let installed = false;
let originalConsoleError = null;
let originalConsoleWarn = null;
let originalFetch = null;
const recentSignatures = new Map();

const redact = (value, maxLength = MAX_MESSAGE_LENGTH) =>
  String(value || '')
    .replace(/(Bearer\s+)[A-Za-z0-9._~+\/-]+=*/gi, '$1[redacted]')
    .replace(/([?&](?:apikey|api_key|access_token|refresh_token|token|password|secret)=)[^&\s]+/gi, '$1[redacted]')
    .replace(/(["']?(?:authorization|apikey|api_key|access_token|refresh_token|token|password|secret)["']?\s*:\s*["']?)[^"'&,}\s]+/gi, '$1[redacted]')
    .slice(0, maxLength);

const stringifySafely = (value) => {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const getRequestDetails = (input, init) => {
  const rawUrl = typeof input === 'string' || input instanceof URL
    ? String(input)
    : input?.url || String(input || '');
  let requestUrl = rawUrl;

  try {
    const parsed = new URL(rawUrl, window.location.origin);
    // Avoid storing query strings because they can contain tokens or user data.
    requestUrl = `${parsed.origin}${parsed.pathname}`;
  } catch {
    requestUrl = rawUrl.split(/[?#]/, 1)[0];
  }

  const method = String(init?.method || input?.method || 'GET').toUpperCase();
  const isErrorLoggerRequest = /\/rest\/v1\/error_logs\/?$/i.test(requestUrl);

  return { requestUrl, method, isErrorLoggerRequest };
};

const normalizeError = (error) => {
  if (error instanceof Error) {
    return {
      name: error.name || 'Error',
      message: error.message || error.name || 'Unknown error',
      code: error.code || error.status || null,
      stack: error.stack || null,
    };
  }

  if (error && typeof error === 'object') {
    return {
      name: error.name || error.constructor?.name || 'Error',
      message:
        error.message ||
        error.error_description ||
        error.error ||
        stringifySafely(error) ||
        'Unknown error',
      code: error.code || error.status || null,
      stack: error.stack || null,
    };
  }

  return {
    name: 'Error',
    message: stringifySafely(error) || 'Unknown error',
    code: null,
    stack: null,
  };
};

const getSessionId = () => {
  try {
    let id = window.sessionStorage.getItem(SESSION_ID_KEY);
    if (!id) {
      id = globalThis.crypto?.randomUUID?.() ||
        `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      window.sessionStorage.setItem(SESSION_ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
};

const canLogAnotherError = () => {
  try {
    const count = Number(window.sessionStorage.getItem(ERROR_COUNT_KEY) || 0);
    if (count >= MAX_ERRORS_PER_SESSION) return false;
    window.sessionStorage.setItem(ERROR_COUNT_KEY, String(count + 1));
    return true;
  } catch {
    return true;
  }
};

const safeContext = (context) => {
  if (!context || typeof context !== 'object' || Array.isArray(context)) return {};

  const result = {};
  for (const [key, value] of Object.entries(context).slice(0, 30)) {
    const safeKey = redact(key, 100);
    const safeValue = /authorization|apikey|api_key|access_token|refresh_token|token|password|secret/i.test(key)
      ? '[redacted]'
      : typeof value === 'string'
      ? redact(value, 1000)
      : value === null || ['boolean', 'number'].includes(typeof value)
        ? value
        : redact(stringifySafely(value), 1000);
    result[safeKey] = safeValue;
  }
  return result;
};

export const reportClientError = (error, options = {}) => {
  if (!supabaseClient || typeof window === 'undefined') return;

  const details = normalizeError(error);
  const errorType = redact(options.errorType || 'application_error', 80);
  const message = redact(details.message);
  const stack = details.stack ? redact(details.stack, MAX_STACK_LENGTH) : null;
  const signature = `${message}|${stack || ''}`;
  const now = Date.now();
  const lastSeen = recentSignatures.get(signature) || 0;

  // A single browser exception can reach both window.onerror and console.error.
  // Collapse that immediate duplicate while retaining later occurrences.
  if (now - lastSeen < 1500) return;
  recentSignatures.set(signature, now);

  if (recentSignatures.size > 200) {
    const cutoff = now - 10000;
    for (const [key, timestamp] of recentSignatures) {
      if (timestamp < cutoff) recentSignatures.delete(key);
    }
  }

  if (!canLogAnotherError()) return;

  const context = safeContext(options.context);
  let source = options.source ? String(options.source) : null;
  if (source) {
    try {
      source = new URL(source, window.location.origin).pathname;
    } catch {
      source = source.split(/[?#]/, 1)[0];
    }
  }
  const row = {
    reporter: 'Client',
    session_id: getSessionId(),
    error_type: errorType,
    error_name: redact(details.name || 'Error', 120),
    message,
    error_code: details.code === null ? null : redact(details.code, 120),
    source: source ? redact(source, 1000) : null,
    page_path: window.location.pathname.slice(0, 1000),
    line_number: Number.isInteger(options.lineNumber) ? options.lineNumber : null,
    column_number: Number.isInteger(options.columnNumber) ? options.columnNumber : null,
    user_agent: redact(navigator.userAgent || '', 1000),
    is_webdriver: navigator.webdriver === true,
    stack,
    component_stack: options.componentStack
      ? redact(options.componentStack, MAX_STACK_LENGTH)
      : null,
    context,
  };

  // Do not send logger failures back through console.error; that would recurse.
  void supabaseClient
    .from('error_logs')
    .insert([row])
    .then(({ error: insertError }) => {
      if (insertError && originalConsoleError) {
        originalConsoleError('[Error Logger] Failed to persist a client error.', insertError.message);
      }
    })
    .catch((insertError) => {
      if (originalConsoleError) {
        originalConsoleError('[Error Logger] Failed to persist a client error.', insertError);
      }
    });
};

export const installClientErrorLogging = (client) => {
  if (installed || typeof window === 'undefined') return;
  supabaseClient = client;
  if (!supabaseClient) return;
  installed = true;

  originalConsoleError = console.error.bind(console);
  originalConsoleWarn = console.warn.bind(console);
  originalFetch = window.fetch.bind(window);

  // Observe API and other fetch failures without consuming or changing the
  // response returned to the application. Exclude this logger's own insert to
  // prevent a failed log write from recursively creating more log writes.
  window.fetch = async (input, init) => {
    const request = getRequestDetails(input, init);
    try {
      const response = await originalFetch(input, init);
      if (!response.ok && !request.isErrorLoggerRequest) {
        const apiError = new Error(
          `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`,
        );
        apiError.status = response.status;
        reportClientError(
          apiError,
          {
            errorType: 'api_http_error',
            source: request.requestUrl,
            context: {
              method: request.method,
              request_url: request.requestUrl,
              status: response.status,
              status_text: response.statusText || null,
            },
          },
        );
      }
      return response;
    } catch (error) {
      if (!request.isErrorLoggerRequest) {
        reportClientError(error, {
          errorType: 'api_network_error',
          source: request.requestUrl,
          context: {
            method: request.method,
            request_url: request.requestUrl,
          },
        });
      }
      throw error;
    }
  };

  console.error = (...args) => {
    originalConsoleError(...args);
    const errorValue =
      args.find((value) => value instanceof Error) ||
      args.find((value) =>
        value &&
        typeof value === 'object' &&
        (value.message || value.error_description || value.code || value.status)
      ) ||
      args[0];
    const logMessage = args.map(stringifySafely).join(' ').slice(0, MAX_MESSAGE_LENGTH);
    reportClientError(errorValue, {
      errorType: 'console_error',
      context: { console_message: logMessage },
    });
  };

  console.warn = (...args) => {
    originalConsoleWarn(...args);
    const warningMessage = args.map(stringifySafely).join(' ').slice(0, MAX_MESSAGE_LENGTH);
    const errorValue =
      args.find((value) => value instanceof Error) ||
      args.find((value) =>
        value &&
        typeof value === 'object' &&
        (value.message || value.error_description || value.code || value.status)
      );

    if (errorValue || /error|failed|failure|unavailable|skipped/i.test(warningMessage)) {
      reportClientError(errorValue || new Error(warningMessage), {
        errorType: 'handled_warning',
        context: { console_message: warningMessage },
      });
    }
  };

  window.addEventListener('error', (event) => {
    // Ignore resource-load events here; console errors and application
    // exceptions are captured without flooding the table with failed images.
    if (!(event instanceof ErrorEvent)) return;
    reportClientError(event.error || event.message, {
      errorType: 'uncaught_error',
      source: event.filename,
      lineNumber: event.lineno,
      columnNumber: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportClientError(event.reason, { errorType: 'unhandled_rejection' });
  });
};
