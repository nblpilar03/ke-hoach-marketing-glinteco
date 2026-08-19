// API lưu trạng thái kế hoạch tuyến bài.
// GET  /api/state        -> { rev, ts, data }
// POST /api/state        -> body { baseRev, data }  -> { rev, ts }
//                           409 nếu có người khác đã lưu bản mới hơn
//
// Cần biến môi trường (Vercel tự tạo khi bạn thêm Upstash Redis từ Marketplace):
//   KV_REST_API_URL   hoặc UPSTASH_REDIS_REST_URL
//   KV_REST_API_TOKEN hoặc UPSTASH_REDIS_REST_TOKEN
// Tuỳ chọn:
//   EDIT_PASSWORD  -> nếu đặt, muốn lưu phải gửi header x-edit-key đúng mật khẩu
//   STATE_KEY      -> tên khoá lưu trong Redis, mặc định glinteco:plan

const REDIS_URL =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const STATE_KEY = process.env.STATE_KEY || 'glinteco:plan';
const EDIT_PASSWORD = process.env.EDIT_PASSWORD || '';

async function redis(command) {
  if (!REDIS_URL || !REDIS_TOKEN) {
    throw new Error('Chưa cấu hình Redis. Thêm Upstash Redis trong Vercel > Storage.');
  }
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error('Redis lỗi ' + res.status);
  const json = await res.json();
  return json.result;
}

async function readState() {
  const raw = await redis(['GET', STATE_KEY]);
  if (!raw) return { rev: 0, ts: 0, data: null };
  try {
    return JSON.parse(raw);
  } catch (e) {
    return { rev: 0, ts: 0, data: null };
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  try {
    if (req.method === 'GET') {
      const state = await readState();
      return res.status(200).json(state);
    }

    if (req.method === 'POST') {
      if (EDIT_PASSWORD && req.headers['x-edit-key'] !== EDIT_PASSWORD) {
        return res.status(401).json({ error: 'Sai mật khẩu chỉnh sửa' });
      }

      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = null; }
      }
      if (!body || typeof body !== 'object' || !body.data) {
        return res.status(400).json({ error: 'Thiếu dữ liệu' });
      }

      const current = await readState();
      const baseRev = Number(body.baseRev || 0);

      if (current.rev !== baseRev) {
        // Có người khác đã lưu trong lúc mình đang sửa
        return res.status(409).json(current);
      }

      const next = { rev: current.rev + 1, ts: Date.now(), data: body.data };
      await redis(['SET', STATE_KEY, JSON.stringify(next)]);
      return res.status(200).json({ rev: next.rev, ts: next.ts });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) });
  }
}
