import { describe, it, expect, beforeAll } from 'vitest';
import axios, { AxiosError } from 'axios';

const API_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';
const PASSWORD = 'pizza123';

/** Helper: login and return access token */
async function login(username: string): Promise<string> {
  const res = await axios.post(`${API_URL}/api/auth/login`, {
    username,
    password: PASSWORD,
  });
  return res.data.access_token;
}

/** Helper: get headers with auth + country */
function authHeaders(token: string, country: string) {
  return {
    Authorization: `Bearer ${token}`,
    'X-Country-Code': country,
  };
}

// ---------------------------------------------------------------------------
// Auth Login
// ---------------------------------------------------------------------------
describe('POST /api/auth/login', () => {
  it('should return token, username, and behavior for valid credentials', async () => {
    const res = await axios.post(`${API_URL}/api/auth/login`, {
      username: 'standard_user',
      password: PASSWORD,
    });

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('access_token');
    expect(res.data).toHaveProperty('username');
    expect(res.data).toHaveProperty('behavior');
  });

  it('should reject invalid credentials', async () => {
    try {
      await axios.post(`${API_URL}/api/auth/login`, {
        username: 'standard_user',
        password: 'wrong_password',
      });
      expect.unreachable('Should have thrown');
    } catch (err) {
      const error = err as AxiosError;
      expect(error.response?.status).toBe(401);
    }
  });
});

// ---------------------------------------------------------------------------
// Pizzas endpoint – requires headers
// ---------------------------------------------------------------------------
describe('GET /api/pizzas validation', () => {
  it('should require X-Country-Code header', async () => {
    try {
      await axios.get(`${API_URL}/api/pizzas`);
      expect.unreachable('Should have thrown');
    } catch (err) {
      const error = err as AxiosError;
      expect(error.response?.status).toBe(400);
    }
  });

  it('should return pizzas with valid headers', async () => {
    const token = await login('standard_user');
    const res = await axios.get(`${API_URL}/api/pizzas`, {
      headers: authHeaders(token, 'MX'),
    });

    expect(res.status).toBe(200);
    expect(res.data.pizzas.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Checkout validation
// ---------------------------------------------------------------------------
describe('POST /api/checkout validation', () => {
  it('should require authentication', async () => {
    try {
      await axios.post(`${API_URL}/api/checkout`, {
        country_code: 'MX',
        items: [],
        name: 'Test',
        address: '123 St',
        phone: '5512345678',
      });
      expect.unreachable('Should have thrown');
    } catch (err) {
      const error = err as AxiosError;
      expect(error.response?.status).toBe(401);
    }
  });
});

// ---------------------------------------------------------------------------
// User Behavior: Locked Out
// ---------------------------------------------------------------------------
describe('User Behavior: Locked Out', () => {
  it('should return 403 for locked_out_user', async () => {
    try {
      await axios.post(`${API_URL}/api/auth/login`, {
        username: 'locked_out_user',
        password: PASSWORD,
      });
      expect.unreachable('Should have thrown');
    } catch (err) {
      const error = err as AxiosError;
      expect(error.response?.status).toBe(403);
      expect(
        ((error.response?.data as Record<string, string>)?.detail ?? '').toLowerCase(),
      ).toContain('locked out');
    }
  });
});

// ---------------------------------------------------------------------------
// E2E Flow: Standard User
// ---------------------------------------------------------------------------
describe('E2E Flow: Standard User', () => {
  let token: string;
  let pizzas: Array<{ id: string }>;

  beforeAll(async () => {
    token = await login('standard_user');
  });

  it('should login successfully', () => {
    expect(token).toBeTruthy();
  });

  it('should get pizzas for MX market', async () => {
    const res = await axios.get(`${API_URL}/api/pizzas`, {
      headers: authHeaders(token, 'MX'),
    });

    expect(res.status).toBe(200);
    pizzas = res.data.pizzas;
    expect(pizzas.length).toBeGreaterThan(0);
  });

  it('should checkout successfully', async () => {
    // Ensure pizzas were fetched
    if (!pizzas || pizzas.length === 0) {
      const res = await axios.get(`${API_URL}/api/pizzas`, {
        headers: authHeaders(token, 'MX'),
      });
      pizzas = res.data.pizzas;
    }

    const res = await axios.post(
      `${API_URL}/api/checkout`,
      {
        country_code: 'MX',
        items: [{ pizza_id: pizzas[0].id, quantity: 1 }],
        name: 'Test User',
        address: 'Test Address 123',
        phone: '5512345678',
        colonia: 'Test Colonia',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('order_id');
  });
});

// ---------------------------------------------------------------------------
// Country Specific Logic
// ---------------------------------------------------------------------------
describe('Country Specific Logic', () => {
  let token: string;
  let pizzaId: string;

  beforeAll(async () => {
    token = await login('standard_user');

    const res = await axios.get(`${API_URL}/api/pizzas`, {
      headers: authHeaders(token, 'US'),
    });
    pizzaId = res.data.pizzas[0].id;
  });

  it('should reject US checkout without zip_code', async () => {
    try {
      await axios.post(
        `${API_URL}/api/checkout`,
        {
          country_code: 'US',
          items: [{ pizza_id: pizzaId, quantity: 1 }],
          name: 'Test User',
          address: 'Test Address 123',
          phone: '5551234567',
          // Missing zip_code
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      expect.unreachable('Should have thrown');
    } catch (err) {
      const error = err as AxiosError;
      expect(error.response?.status).toBe(400);
    }
  });

  it('should accept US checkout with valid zip_code', async () => {
    const res = await axios.post(
      `${API_URL}/api/checkout`,
      {
        country_code: 'US',
        items: [{ pizza_id: pizzaId, quantity: 1 }],
        name: 'Test User',
        address: 'Test Address 123',
        phone: '5551234567',
        zip_code: '12345',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Debug Endpoints
// ---------------------------------------------------------------------------
describe('Debug Endpoints', () => {
  it('should add latency on /api/debug/latency-spike', async () => {
    const start = Date.now();
    const res = await axios.get(`${API_URL}/api/debug/latency-spike`);
    const duration = (Date.now() - start) / 1000;

    expect(res.status).toBe(200);
    expect(duration).toBeGreaterThanOrEqual(0.5);
  });

  it('should return fibonacci result on /api/debug/cpu-load', async () => {
    const res = await axios.get(`${API_URL}/api/debug/cpu-load`);

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('fibonacci_35');
  });

  it('should return metrics as text/plain on /api/debug/metrics', async () => {
    const res = await axios.get(`${API_URL}/api/debug/metrics`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
  });
});
