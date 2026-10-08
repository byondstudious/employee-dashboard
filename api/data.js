import crypto from 'crypto';

function verify(token) {
  try {
    const [username, expires, signature] = Buffer.from(token, 'base64').toString('utf8').split('.');
    const expected = crypto.createHmac('sha256', process.env.SESSION_SECRET)
      .update(`${username}.${expires}`).digest('hex');
    if (signature !== expected) return null;
    if (Date.now() > Number(expires)) return null;
    return username;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!verify(token)) return res.status(401).json({ error: 'Not authenticated' });

  const baseId = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_TABLE_NAME || 'Leads';
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}` +
    `?sort[0][field]=Received&sort[0][direction]=desc&maxRecords=50`;

  const airtableRes = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` }
  });

     if (!airtableRes.ok) {
     const detail = await airtableRes.text();
     return res.status(502).json({ error: 'Failed to fetch data', status: airtableRes.status, detail });
   }

  const data = await airtableRes.json();
  res.status(200).json({ records: data.records });
}
