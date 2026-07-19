import { describe, it, expect } from 'vitest';
import axios from 'axios';

const API_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';
const PASSWORD = process.env.TEST_USER_PASSWORD ?? 'pizza123';

async function login(username: string): Promise<string> {
  const res = await axios.post(`${API_URL}/api/auth/login`, { username, password: PASSWORD });
  return res.data.access_token;
}

function checkoutHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function catalogHeaders(token: string, country: string, lang: string) {
  return { Authorization: `Bearer ${token}`, 'X-Country-Code': country, 'X-Language': lang };
}

// customer_info is only visible via the orders list, not the OrderSummary responses.
async function findOrderById(token: string, orderId: string): Promise<any> {
  const res = await axios.get(`${API_URL}/api/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const order = res.data.orders.find((o: any) => o.order_id === orderId);
  if (!order) throw new Error(`order ${orderId} not found in /api/orders`);
  return order;
}

// POST /api/cart seeds the per-user cart (auth only, no country header).
async function seedCart(token: string, items: unknown[]): Promise<void> {
  await axios.post(
    `${API_URL}/api/cart`,
    { items },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
  );
}

// Ground truth captured 2026-07-12 from calculate_order_total() for a
// [{p01, quantity: 2}] cart with a 15% tip, per market.
const GOLDEN: Record<
  string,
  {
    symbol: string;
    requiredField: string;
    requiredValue: string;
    tipField: string;
    totals: {
      subtotal: number; delivery_fee: number; tax_rate: number;
      tip_percentage: number; tax: number; tip: number; total: number; currency: string;
    };
  }
> = {
  MX: {
    symbol: '$', requiredField: 'colonia', requiredValue: 'Roma Norte', tipField: 'propina',
    totals: { subtotal: 455.94, delivery_fee: 35.1, tax_rate: 0.16, tip_percentage: 15, tax: 72.95, tip: 68.39, total: 632.38, currency: 'MXN' },
  },
  US: {
    symbol: '$', requiredField: 'zip_code', requiredValue: '12345', tipField: 'tip',
    totals: { subtotal: 25.98, delivery_fee: 2.0, tax_rate: 0.08, tip_percentage: 15, tax: 2.08, tip: 3.9, total: 33.96, currency: 'USD' },
  },
  CH: {
    symbol: 'CHF', requiredField: 'plz', requiredValue: '8001', tipField: 'trinkgeld',
    totals: { subtotal: 20.32, delivery_fee: 1.56, tax_rate: 0.081, tip_percentage: 15, tax: 1.65, tip: 3.05, total: 26.58, currency: 'CHF' },
  },
  JP: {
    symbol: '¥', requiredField: 'prefectura', requiredValue: 'Tokyo', tipField: 'chip',
    totals: { subtotal: 4102, delivery_fee: 316, tax_rate: 0.1, tip_percentage: 15, tax: 410, tip: 615, total: 5443, currency: 'JPY' },
  },
  SA: {
    symbol: 'ر.س', requiredField: 'district', requiredValue: 'Al Olaya', tipField: 'baksheesh',
    totals: { subtotal: 97.42, delivery_fee: 7.5, tax_rate: 0.15, tip_percentage: 15, tax: 14.61, tip: 14.61, total: 134.14, currency: 'SAR' },
  },
};

describe('Golden: checkout totals + customer_info per market', () => {
  it.each(Object.entries(GOLDEN))(
    '%s: OrderSummary totals and stored customer_info match golden',
    async (market, g) => {
      const token = await login('standard_user');
      const catalog = await axios.get(`${API_URL}/api/pizzas`, {
        headers: catalogHeaders(token, market, 'en'),
      });
      const pizzaId = catalog.data.pizzas[0].id; // p01

      const body: Record<string, unknown> = {
        country_code: market,
        items: [{ pizza_id: pizzaId, quantity: 2 }],
        name: 'QA Bot',
        address: '123 Test Street',
        phone: '5551234567',
        [g.requiredField]: g.requiredValue,
        [g.tipField]: 15,
      };

      const res = await axios.post(`${API_URL}/api/checkout`, body, {
        headers: checkoutHeaders(token),
      });

      expect(res.status).toBe(200);
      const d = res.data;
      expect(d.subtotal).toBe(g.totals.subtotal);
      expect(d.delivery_fee).toBe(g.totals.delivery_fee);
      expect(d.tax_rate).toBe(g.totals.tax_rate);
      expect(d.tip_percentage).toBe(g.totals.tip_percentage);
      expect(d.tax).toBe(g.totals.tax);
      expect(d.tip).toBe(g.totals.tip);
      expect(d.total).toBe(g.totals.total);
      expect(d.currency).toBe(g.totals.currency);
      expect(d.currency_symbol).toBe(g.symbol);

      const order = await findOrderById(token, d.order_id);
      expect(order.customer_info).toEqual({
        name: 'QA Bot',
        address: '123 Test Street',
        phone: '5551234567',
        [g.requiredField]: g.requiredValue,
        [g.tipField]: 15,
      });
    },
  );
});

describe('Golden: MX optional-field inclusion rules', () => {
  it('propina=0 is preserved; zip_code included only when truthy', async () => {
    const token = await login('standard_user');
    const catalog = await axios.get(`${API_URL}/api/pizzas`, {
      headers: catalogHeaders(token, 'MX', 'es'),
    });
    const pizzaId = catalog.data.pizzas[0].id;

    const res = await axios.post(
      `${API_URL}/api/checkout`,
      {
        country_code: 'MX',
        items: [{ pizza_id: pizzaId, quantity: 2 }],
        name: 'QA Bot',
        address: '123 Test Street',
        phone: '5551234567',
        colonia: 'Roma Norte',
        zip_code: '54321',
        propina: 0,
      },
      { headers: checkoutHeaders(token) },
    );

    expect(res.status).toBe(200);
    expect(res.data.tip_percentage).toBe(0);
    expect(res.data.tip).toBe(0);

    const order = await findOrderById(token, res.data.order_id);
    expect(order.customer_info).toEqual({
      name: 'QA Bot',
      address: '123 Test Street',
      phone: '5551234567',
      colonia: 'Roma Norte',
      zip_code: '54321',
      propina: 0,
    });
  });

  it('propina omitted: no tip key in customer_info, tip is 0', async () => {
    const token = await login('standard_user');
    const catalog = await axios.get(`${API_URL}/api/pizzas`, {
      headers: catalogHeaders(token, 'MX', 'es'),
    });
    const pizzaId = catalog.data.pizzas[0].id;

    const res = await axios.post(
      `${API_URL}/api/checkout`,
      {
        country_code: 'MX',
        items: [{ pizza_id: pizzaId, quantity: 2 }],
        name: 'QA Bot',
        address: '123 Test Street',
        phone: '5551234567',
        colonia: 'Roma Norte',
      },
      { headers: checkoutHeaders(token) },
    );

    expect(res.status).toBe(200);
    expect(res.data.tip_percentage).toBe(0);
    expect(res.data.tip).toBe(0);

    const order = await findOrderById(token, res.data.order_id);
    expect(order.customer_info).toEqual({
      name: 'QA Bot',
      address: '123 Test Street',
      phone: '5551234567',
      colonia: 'Roma Norte',
    });
  });
});

describe('Golden: multi-item cart (distinct pizza_ids) totals', () => {
  it('MX: large + toppings + second pizza matches golden', async () => {
    const token = await login('standard_user');
    const catalog = await axios.get(`${API_URL}/api/pizzas`, {
      headers: catalogHeaders(token, 'MX', 'es'),
    });
    const p01 = catalog.data.pizzas.find((p: any) => p.id === 'p01').id;
    const p02 = catalog.data.pizzas.find((p: any) => p.id === 'p02').id;

    const res = await axios.post(
      `${API_URL}/api/checkout`,
      {
        country_code: 'MX',
        items: [
          { pizza_id: p01, quantity: 2, size: 'large', toppings: ['a', 'b'] },
          { pizza_id: p02, quantity: 1 },
        ],
        name: 'QA Bot',
        address: '123 Test Street',
        phone: '5551234567',
        colonia: 'Roma Norte',
        propina: 15,
      },
      { headers: checkoutHeaders(token) },
    );

    expect(res.status).toBe(200);
    const d = res.data;
    expect(d.subtotal).toBe(933.01);
    expect(d.delivery_fee).toBe(35.1);
    expect(d.tax).toBe(149.28);
    expect(d.tip).toBe(139.95);
    expect(d.total).toBe(1257.34);
    expect(d.currency).toBe('MXN');
  });
});

describe('Golden: catalog translation + pricing', () => {
  it('MX/es: p01 Spanish name + description, converted price', async () => {
    const token = await login('standard_user');
    const res = await axios.get(`${API_URL}/api/pizzas`, {
      headers: catalogHeaders(token, 'MX', 'es'),
    });
    const p01 = res.data.pizzas.find((p: any) => p.id === 'p01');
    const p02 = res.data.pizzas.find((p: any) => p.id === 'p02');
    expect(p01.name).toBe('Margarita');
    expect(p01.description).toBe('Tomate, mozzarella, albahaca');
    expect(p01.price).toBe(227.97);
    expect(p01.currency).toBe('MXN');
    expect(p01.currency_symbol).toBe('$');
    expect(p02.name).toBe('Pepperoni');
    expect(p02.price).toBe(263.07);
  });

  it('MX/en: p01 falls back to English, same price', async () => {
    const token = await login('standard_user');
    const res = await axios.get(`${API_URL}/api/pizzas`, {
      headers: catalogHeaders(token, 'MX', 'en'),
    });
    const p01 = res.data.pizzas.find((p: any) => p.id === 'p01');
    expect(p01.name).toBe('Margherita');
    expect(p01.description).toBe('Tomato, mozzarella, basil');
    expect(p01.price).toBe(227.97);
  });

  it('JP/ja: p01 Japanese name + integer yen price (decimal_places=0)', async () => {
    const token = await login('standard_user');
    const res = await axios.get(`${API_URL}/api/pizzas`, {
      headers: catalogHeaders(token, 'JP', 'ja'),
    });
    const p01 = res.data.pizzas.find((p: any) => p.id === 'p01');
    expect(p01.name).toBe('マルゲリータ');
    expect(p01.description).toBe('トマト、モッツァレラ、バジル');
    expect(p01.price).toBe(2051);
    expect(p01.currency_symbol).toBe('¥');
  });

  it('SA/ar: all pizza names and descriptions are localized in Arabic', async () => {
    const token = await login('standard_user');
    const res = await axios.get(`${API_URL}/api/pizzas`, {
      headers: catalogHeaders(token, 'SA', 'ar'),
    });

    expect(
      res.data.pizzas.map(({ id, name, description }: any) => ({ id, name, description })),
    ).toEqual([
      { id: 'p01', name: 'مارغريتا', description: 'طماطم، موزاريلا، ريحان' },
      { id: 'p02', name: 'بيبروني', description: 'بيبروني بقري، موزاريلا، صلصة طماطم' },
      { id: 'p03', name: 'هاوايان', description: 'ديك رومي مدخن، أناناس، موزاريلا' },
      { id: 'p04', name: 'أربعة أجبان', description: 'موزاريلا، بارميزان، غورغونزولا، بروفولون' },
      { id: 'p05', name: 'خضروات', description: 'فطر، فلفل، زيتون، بصل' },
      { id: 'p06', name: 'مارينارا', description: 'طماطم، ثوم، أوريغانو' },
      { id: 'p07', name: 'كابريتشوزا', description: 'ديك رومي مدخن، فطر، خرشوف، زيتون' },
      { id: 'p08', name: 'ديافولا', description: 'سلامي بقري حار، فلفل حار، موزاريلا' },
      { id: 'p09', name: 'بريسولا', description: 'بريسولا، جرجير، بارميزان' },
      { id: 'p10', name: 'الفصول الأربعة', description: 'خرشوف، زيتون، ديك رومي مدخن، فطر' },
      { id: 'p11', name: 'فونغي', description: 'فطر، موزاريلا، أوريغانو' },
      { id: 'p12', name: 'دجاج باربكيو', description: 'دجاج، صلصة باربكيو، بصل، كزبرة' },
    ]);
    expect(JSON.stringify(res.data.pizzas)).not.toMatch(/هام|بروسكيوتو/);
    expect(res.data.currency).toBe('SAR');
  });
});

describe('Golden: problem_user chaos behavior', () => {
  it('MX: problem_user gets $0 prices and the broken image', async () => {
    const token = await login('problem_user');
    const res = await axios.get(`${API_URL}/api/pizzas`, {
      headers: catalogHeaders(token, 'MX', 'es'),
    });
    const p01 = res.data.pizzas.find((p: any) => p.id === 'p01');
    expect(p01.price).toBe(0);
    expect(p01.image).toBe('https://broken-image-url.com/404.jpg');
  });
});

describe('Golden: cart enrichment (GET /api/cart)', () => {
  it('MX/es standard: converted price with raw-USD base_price', async () => {
    const token = await login('standard_user');
    await seedCart(token, [{ pizza_id: 'p01', quantity: 2 }]);
    const res = await axios.get(`${API_URL}/api/cart`, {
      headers: catalogHeaders(token, 'MX', 'es'),
    });
    expect(res.data.cart_items).toEqual([
      {
        pizza_id: 'p01',
        name: 'Margarita',
        size: 'small',
        quantity: 2,
        price: 227.97,
        base_price: 12.99,
        currency: 'MXN',
        currency_symbol: '$',
        image:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Margherita_pizza.jpg/500px-Margherita_pizza.jpg',
      },
    ]);
  });

  it('JP/ja standard: Japanese name + integer yen price', async () => {
    const token = await login('standard_user');
    await seedCart(token, [{ pizza_id: 'p01', quantity: 2 }]);
    const res = await axios.get(`${API_URL}/api/cart`, {
      headers: catalogHeaders(token, 'JP', 'ja'),
    });
    expect(res.data.cart_items).toEqual([
      {
        pizza_id: 'p01',
        name: 'マルゲリータ',
        size: 'small',
        quantity: 2,
        price: 2051,
        base_price: 12.99,
        currency: 'JPY',
        currency_symbol: '¥',
        image:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Margherita_pizza.jpg/500px-Margherita_pizza.jpg',
      },
    ]);
  });

  it('MX/es problem_user: price 0 + broken image, name still translated', async () => {
    const token = await login('problem_user');
    await seedCart(token, [{ pizza_id: 'p01', quantity: 2 }]);
    const res = await axios.get(`${API_URL}/api/cart`, {
      headers: catalogHeaders(token, 'MX', 'es'),
    });
    expect(res.data.cart_items).toEqual([
      {
        pizza_id: 'p01',
        name: 'Margarita',
        size: 'small',
        quantity: 2,
        price: 0,
        base_price: 12.99,
        currency: 'MXN',
        currency_symbol: '$',
        image: 'https://broken-image-url.com/404.jpg',
      },
    ]);
  });
});

describe('Golden: new chaos users are registered', () => {
  it('a11y_glitch_user and security_glitch_user appear in /api/auth/users and can log in', async () => {
    const listRes = await axios.get(`${API_URL}/api/auth/users`);
    const usernames = listRes.data.map((u: any) => u.username);
    expect(usernames).toContain('a11y_glitch_user');
    expect(usernames).toContain('security_glitch_user');

    const a11yToken = await login('a11y_glitch_user');
    expect(typeof a11yToken).toBe('string');

    const securityToken = await login('security_glitch_user');
    expect(typeof securityToken).toBe('string');
  });
});

describe('Golden: a11y_glitch_user catalog behavior', () => {
  it('MX/es: every call lands on exactly one of the three a11y modes; price/currency unaffected', async () => {
    const token = await login('a11y_glitch_user');
    const seenModes = new Set<string>();

    for (let i = 0; i < 30; i++) {
      const res = await axios.get(`${API_URL}/api/pizzas`, {
        headers: catalogHeaders(token, 'MX', 'es'),
      });
      const p01 = res.data.pizzas.find((p: any) => p.id === 'p01');

      expect(p01.price).toBe(227.97);
      expect(p01.currency).toBe('MXN');
      expect(p01.image).not.toBe('https://broken-image-url.com/404.jpg');

      if (p01.name === '') {
        seenModes.add('missing_name');
      } else if (p01.name.length > 100) {
        seenModes.add('extreme_text');
      } else if (p01.name !== 'Margarita') {
        seenModes.add('wrong_lang');
      } else {
        throw new Error(`unexpected clean name for a11y_glitch_user: ${JSON.stringify(p01.name)}`);
      }
    }

    expect(seenModes).toEqual(new Set(['missing_name', 'wrong_lang', 'extreme_text']));
  });
});

describe('Golden: a11y_glitch_user cart behavior', () => {
  it('MX/es: enriched cart name lands on one of the three a11y modes', async () => {
    const token = await login('a11y_glitch_user');
    await seedCart(token, [{ pizza_id: 'p01', quantity: 2 }]);
    const seenModes = new Set<string>();

    for (let i = 0; i < 30; i++) {
      const res = await axios.get(`${API_URL}/api/cart`, {
        headers: catalogHeaders(token, 'MX', 'es'),
      });
      const item = res.data.cart_items[0];

      expect(item.price).toBe(227.97);
      expect(item.currency).toBe('MXN');

      if (item.name === '') {
        seenModes.add('missing_name');
      } else if (item.name.length > 100) {
        seenModes.add('extreme_text');
      } else if (item.name !== 'Margarita') {
        seenModes.add('wrong_lang');
      } else {
        throw new Error(`unexpected clean name for a11y_glitch_user: ${JSON.stringify(item.name)}`);
      }
    }

    expect(seenModes).toEqual(new Set(['missing_name', 'wrong_lang', 'extreme_text']));
  });
});

describe('Golden: security_glitch_user profile poisoning', () => {
  it('login seeds exactly one profile field with one canned XSS-probe payload', async () => {
    const PAYLOADS = [
      "<script>alert('xss-test')</script>",
      "<img src=x onerror=\"console.warn('xss-test')\">",
      "\"><svg onload=alert(1)>",
    ];
    const FIELDS = ['full_name', 'address', 'notes'] as const;

    const token = await login('security_glitch_user');
    const res = await axios.get(`${API_URL}/api/users/me/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const poisoned = FIELDS.filter((f) => PAYLOADS.includes(res.data[f]));
    expect(poisoned.length).toBe(1);

    const clean = FIELDS.filter((f) => f !== poisoned[0]);
    clean.forEach((f) => expect(res.data[f]).toBe(''));
  });
});

describe('Golden: security_glitch_user IDOR on order detail', () => {
  it("reads another user's order by id instead of getting 403", async () => {
    const ownerToken = await login('standard_user');
    const catalog = await axios.get(`${API_URL}/api/pizzas`, {
      headers: catalogHeaders(ownerToken, 'US', 'en'),
    });
    const pizzaId = catalog.data.pizzas[0].id;

    const checkoutRes = await axios.post(
      `${API_URL}/api/checkout`,
      {
        country_code: 'US',
        items: [{ pizza_id: pizzaId, quantity: 1 }],
        name: 'Order Owner',
        address: '1 Owner Street',
        phone: '5550000000',
        zip_code: '12345',
        tip: 0,
      },
      { headers: checkoutHeaders(ownerToken) },
    );
    const orderId = checkoutRes.data.order_id;

    const attackerToken = await login('security_glitch_user');
    const res = await axios.get(`${API_URL}/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${attackerToken}` },
    });

    expect(res.status).toBe(200);
    expect(res.data.order_id).toBe(orderId);
    expect(res.data.subtotal).toBe(checkoutRes.data.subtotal);
  });
});
