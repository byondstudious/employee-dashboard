import crypto from 'crypto';

function sign(payload) {
  return crypto.createHmac('sha256', process.env.SESSION_SECRET).update(payload).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, password } = req.body || {};

  // EMPLOYEE_CREDENTIALS env var — JSON array, e.g.:
  // [{"username":"jane","password":"..."},{"username":"mike","password":"..."}]
  let employees = [];
  try {
    employees = JSON.parse(process.env.EMPLOYEE_CREDENTIALS || '[]');
  } catch {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const match = employees.find(e => e.username === username && e.password === password);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });

  const expires = Date.now() + 1000 * 60 * 60 * 8; // 8-hour session
  const payload = `${username}.${expires}`;
  const token = Buffer.from(`${payload}.${sign(payload)}`).toString('base64');

  res.status(200).json({ token, expires });
}
