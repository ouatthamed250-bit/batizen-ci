import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    };
  },
  usePathname() {
    return '';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies() {
    return {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };
  },
}));

// Mock next/server pour les tests d'API routes
jest.mock('next/server', () => {
  const original = jest.requireActual('next/server');
  return {
    ...original,
    NextResponse: {
      json: (body: any, init?: ResponseInit) => {
        const response = new Response(JSON.stringify(body), {
          status: init?.status || 200,
          headers: { 'Content-Type': 'application/json', ...init?.headers as Record<string, string> },
        });
        Object.defineProperty(response, 'status', { get() { return init?.status || 200; } });
        return response;
      },
    },
  };
});

// Mock global Request pour Node.js
if (typeof Request === 'undefined') {
  (global as any).Request = class MockRequest {
    url: string;
    method: string;
    headers: Map<string, string>;
    body: string | null;
    constructor(input: string, init?: RequestInit) {
      this.url = input;
      this.method = init?.method || 'GET';
      this.headers = new Map(Object.entries(init?.headers || {}));
      this.body = init?.body as string | null;
    }
    async json() {
      return this.body ? JSON.parse(this.body) : {};
    }
  };
}