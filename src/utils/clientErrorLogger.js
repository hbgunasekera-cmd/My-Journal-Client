const MAX_MESSAGE_LENGTH = 4000;
const MAX_STACK_LENGTH = 12000;
const SESSION_ID_KEY = 'client_error_session_id';
const PENDING_ERRORS_KEY = 'client_error_pending_queue';

let supabaseClient = null;
let installed = false;
let originalConsoleError = null;
let originalConsoleWarn = null;
let originalFetch = null;
const pendingClientErrors = [];
let pendingRows = [];
let queueLoaded = false;
let queueFlushing = false;
let queueRetryTimer = null;
let queueRetryDelay = 1000;

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

const createUuid = () => globalThis.crypto?.randomUUID?.() ||
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    return (character === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });

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

const loadPendingRows = () => {
  if (queueLoaded || typeof window === 'undefined') return;
  queueLoaded = true;
  try {
    const savedRows = JSON.parse(window.localStorage.getItem(PENDING_ERRORS_KEY) || '[]');
    if (Array.isArray(savedRows)) pendingRows = savedRows;
  } catch (error) {
    if (originalConsoleError) {
      originalConsoleError('[Error Logger] Could not restore queued client errors.', error);
    }
  }
};

const savePendingRows = () => {
  try {
    window.localStorage.setItem(PENDING_ERRORS_KEY, JSON.stringify(pendingRows));
  } catch (error) {
    // Keep queued rows in memory; storage can be unavailable or full.
    if (originalConsoleError) {
      originalConsoleError('[Error Logger] Could not persist the local error queue.', error);
    }
  }
};

const scheduleQueueRetry = () => {
  if (queueRetryTimer !== null) return;
  const delay = queueRetryDelay;
  queueRetryDelay = Math.min(queueRetryDelay * 2, 60000);
  queueRetryTimer = window.setTimeout(() => {
    queueRetryTimer = null;
    void flushPendingRows();
  }, delay);
};

const flushPendingRows = async () => {
  if (
    !supabaseClient ||
    queueFlushing ||
    queueRetryTimer !== null ||
    navigator.onLine === false
  ) return;

  loadPendingRows();
  queueFlushing = true;
  try {
    while (pendingRows.length > 0) {
      const { error } = await supabaseClient
        .from('error_logs')
        .upsert([pendingRows[0]], { onConflict: 'id', ignoreDuplicates: true });
      if (error) throw error;
      pendingRows.shift();
      savePendingRows();
      queueRetryDelay = 1000;
    }
  } catch (error) {
    if (originalConsoleError) {
      originalConsoleError('[Error Logger] Error queue upload failed; it will retry.', error);
    }
    scheduleQueueRetry();
  } finally {
    queueFlushing = false;
  }
};

export const reportClientError = (error, options = {}) => {
  if (typeof window === 'undefined') return;
  if (!supabaseClient) {
    pendingClientErrors.push({ error, options });
    return;
  }

  const details = normalizeError(error);
  const errorType = redact(options.errorType || 'application_error', 80);
  const message = redact(details.message);
  const stack = details.stack ? redact(details.stack, MAX_STACK_LENGTH) : null;

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
    id: createUuid(),
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

  loadPendingRows();
  pendingRows.push(row);
  savePendingRows();
  void flushPendingRows();
};

export const installClientErrorLogging = (client) => {
  if (installed || typeof window === 'undefined') return;
  supabaseClient = client;
  if (!supabaseClient) return;
  installed = true;

  originalConsoleError = console.error.bind(console);
  originalConsoleWarn = console.warn.bind(console);
  originalFetch = window.fetch.bind(window);

  const queuedErrors = pendingClientErrors.splice(0, pendingClientErrors.length);
  for (const queuedError of queuedErrors) {
    reportClientError(queuedError.error, queuedError.options);
  }
  loadPendingRows();
  window.addEventListener('online', () => void flushPendingRows());
  void flushPendingRows();

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

  if (window.XMLHttpRequest) {
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    const originalXhrSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url, ...args) {
      this.__clientErrorRequest = getRequestDetails(String(url), { method });
      return originalXhrOpen.call(this, method, url, ...args);
    };

    XMLHttpRequest.prototype.send = function (...args) {
      const request = this.__clientErrorRequest;
      if (request && !request.isErrorLoggerRequest) {
        let recorded = false;
        let wasAborted = false;
        const reportOnce = (errorType, status = null, statusText = null) => {
          if (recorded) return;
          recorded = true;
          const error = new Error(
            status ? `HTTP ${status}${statusText ? ` ${statusText}` : ''}` : 'XMLHttpRequest failed.',
          );
          if (status) error.status = status;
          reportClientError(error, {
            errorType,
            source: request.requestUrl,
            context: {
              method: request.method,
              request_url: request.requestUrl,
              status,
              status_text: statusText,
            },
          });
        };

        this.addEventListener('error', () => reportOnce('api_network_error'), { once: true });
        this.addEventListener('timeout', () => reportOnce('api_timeout'), { once: true });
        this.addEventListener('abort', () => { wasAborted = true; }, { once: true });
        this.addEventListener('loadend', () => {
          if (this.status >= 400) {
            reportOnce('api_http_error', this.status, this.statusText || null);
          } else if (this.status === 0 && !wasAborted) {
            reportOnce('api_network_error');
          }
        }, { once: true });
      }
      return originalXhrSend.apply(this, args);
    };
  }

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

    if (errorValue || /error|failed|failure|unavailable|skipped|invalid|timeout|timed out|denied|unable|cannot|missing|not found|blocked|rejected/i.test(warningMessage)) {
      reportClientError(errorValue || new Error(warningMessage), {
        errorType: 'handled_warning',
        context: { console_message: warningMessage },
      });
    }
  };

  window.addEventListener('error', (event) => {
    if (event instanceof ErrorEvent) {
      reportClientError(event.error || event.message, {
        errorType: 'uncaught_error',
        source: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno,
      });
      return;
    }

    const element = event.target;
    if (element && element !== window) {
      const resourceUrl = element.src || element.href || element.currentSrc || '';
      const safeResourceUrl = resourceUrl
        ? getRequestDetails(String(resourceUrl)).requestUrl
        : null;
      reportClientError(
        new Error(`${element.tagName || 'Resource'} failed to load.`),
        {
          errorType: 'resource_load_error',
          source: safeResourceUrl,
          context: {
            tag_name: element.tagName || null,
            resource_url: safeResourceUrl,
          },
        },
      );
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    reportClientError(event.reason, { errorType: 'unhandled_rejection' });
  });

  window.addEventListener('securitypolicyviolation', (event) => {
    const blockedUri = event.blockedURI || '';
    const safeBlockedUri = blockedUri
      ? getRequestDetails(blockedUri).requestUrl
      : null;
    reportClientError(
      new Error(`Content Security Policy blocked ${event.violatedDirective || 'a resource'}.`),
      {
        errorType: 'security_policy_error',
        source: safeBlockedUri,
        context: {
          violated_directive: event.violatedDirective || null,
          effective_directive: event.effectiveDirective || null,
          blocked_uri: safeBlockedUri,
        },
      },
    );
  });
};
