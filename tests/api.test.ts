import { describe, it, expect, beforeAll } from 'vitest';
import axios, { AxiosError } from 'axios';

const API_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';
const PASSWORD = process.env.TEST_USER_PASSWORD ?? 'pizza123';

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

  it('should reject CH checkout without plz', async () => {
    const chRes = await axios.get(`${API_URL}/api/pizzas`, {
      headers: authHeaders(token, 'CH'),
    });
    const chPizzaId = chRes.data.pizzas[0].id;

    try {
      await axios.post(
        `${API_URL}/api/checkout`,
        {
          country_code: 'CH',
          items: [{ pizza_id: chPizzaId, quantity: 1 }],
          name: 'Test User',
          address: 'Bahnhofstrasse 1',
          phone: '+41441234567',
          // Missing plz
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

  it('should accept CH checkout with valid plz', async () => {
    const chRes = await axios.get(`${API_URL}/api/pizzas`, {
      headers: authHeaders(token, 'CH'),
    });
    const chPizzaId = chRes.data.pizzas[0].id;

    const res = await axios.post(
      `${API_URL}/api/checkout`,
      {
        country_code: 'CH',
        items: [{ pizza_id: chPizzaId, quantity: 1 }],
        name: 'Test User',
        address: 'Bahnhofstrasse 1',
        phone: '+41441234567',
        plz: '8001',
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

  it('should reject JP checkout without prefectura', async () => {
    const jpRes = await axios.get(`${API_URL}/api/pizzas`, {
      headers: authHeaders(token, 'JP'),
    });
    const jpPizzaId = jpRes.data.pizzas[0].id;

    try {
      await axios.post(
        `${API_URL}/api/checkout`,
        {
          country_code: 'JP',
          items: [{ pizza_id: jpPizzaId, quantity: 1 }],
          name: 'Test User',
          address: 'Shibuya 1-2-3',
          phone: '+81312345678',
          // Missing prefectura
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

  it('should accept JP checkout with valid prefectura', async () => {
    const jpRes = await axios.get(`${API_URL}/api/pizzas`, {
      headers: authHeaders(token, 'JP'),
    });
    const jpPizzaId = jpRes.data.pizzas[0].id;

    const res = await axios.post(
      `${API_URL}/api/checkout`,
      {
        country_code: 'JP',
        items: [{ pizza_id: jpPizzaId, quantity: 1 }],
        name: 'Test User',
        address: 'Shibuya 1-2-3',
        phone: '+81312345678',
        prefectura: 'Tokyo',
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

// ---------------------------------------------------------------------------
// Atomic profile setup — deterministic seed + reset
// The editable profile is per-user mutable state shared across sessions, so a
// save by any session leaks into the next render. These endpoints let tests
// pin a reproducible baseline (seed) or clear it (reset) before a snapshot.
// ---------------------------------------------------------------------------
describe('Atomic Profile Setup', () => {
  const PROFILE_PATH = `${API_URL}/api/users/me/profile`;

  it('POST /api/profile seeds a deterministic baseline; omitted fields revert to default', async () => {
    const token = await login('standard_user');
    const headers = authHeaders(token, 'US');

    // Pollute the profile the way another session would.
    await axios.patch(
      PROFILE_PATH,
      { full_name: '田中 健太', address: '1-2-3 Shibuya' },
      { headers },
    );

    // Seed a frozen baseline — note we do NOT send `address`.
    const seeded = await axios.post(
      `${API_URL}/api/profile`,
      { full_name: 'QA Baseline', phone: '+1 555 0100' },
      { headers },
    );
    expect(seeded.status).toBe(200);
    expect(seeded.data.full_name).toBe('QA Baseline');
    expect(seeded.data.phone).toBe('+1 555 0100');
    // Omitted field reverted to default, not the leaked Shibuya address.
    expect(seeded.data.address).toBe('');

    // GET reflects the same deterministic value.
    const got = await axios.get(PROFILE_PATH, { headers });
    expect(got.data.full_name).toBe('QA Baseline');
    expect(got.data.address).toBe('');
  });

  it('POST /api/session/reset clears the profile back to the empty default', async () => {
    const token = await login('standard_user');
    const headers = authHeaders(token, 'US');

    await axios.post(
      `${API_URL}/api/profile`,
      { full_name: 'Will Be Cleared', notes: 'temp' },
      { headers },
    );

    const reset = await axios.post(`${API_URL}/api/session/reset`, {}, { headers });
    expect(reset.status).toBe(200);

    const got = await axios.get(PROFILE_PATH, { headers });
    expect(got.data.full_name).toBe('');
    expect(got.data.phone).toBe('');
    expect(got.data.address).toBe('');
    expect(got.data.notes).toBe('');
  });
});
