import crypto from 'crypto';

interface TokenCacheEntry {
  token: string;
  expiresAt: number;
}

const tokenCache = new Map<number, TokenCacheEntry>();

export class ZoomOAuthClient {
  private static getCredentials() {
    const accountId = process.env.ZOOM_ACCOUNT_ID || '';
    const clientId = process.env.ZOOM_CLIENT_ID || '';
    const clientSecret = process.env.ZOOM_CLIENT_SECRET || '';
    const webhookSecret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN || '';
    if (!accountId || !clientId || !clientSecret) {
      throw new Error('ZOOM_CREDENTIALS_MISSING: Missing ZOOM_ACCOUNT_ID / ZOOM_CLIENT_ID / ZOOM_CLIENT_SECRET');
    }
    return { accountId, clientId, clientSecret, webhookSecret };
  }

  /**
   * Bẫy #1 của Zoom API: Nếu UUID bắt đầu bằng '/' hoặc chứa '//', bắt buộc Double URL-Encode!
   */
  static encodeZoomUuid(uuid: string): string {
    const raw = String(uuid || '').trim();
    if (!raw) return '';
    if (raw.startsWith('/') || raw.includes('//')) {
      return encodeURIComponent(encodeURIComponent(raw));
    }
    return encodeURIComponent(raw);
  }

  /**
   * Bẫy #2 của Zoom API: Tách token_index=0 (cho REST API nhanh) và token_index=1 (cho luồng stream MP4 dài)
   * để việc xin mới token không bao giờ làm rớt phiên đang tải file video nặng!
   */
  static async getAccessToken(tokenIndex: 0 | 1 = 0, forceRefresh = false): Promise<string> {
    const now = Date.now();
    const cached = tokenCache.get(tokenIndex);
    if (!forceRefresh && cached && cached.expiresAt > now) {
      return cached.token;
    }

    const { accountId, clientId, clientSecret } = this.getCredentials();
    const url = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(
      accountId
    )}&token_index=${tokenIndex}`;
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`ZOOM_OAUTH_FAILED (${resp.status}): ${txt.slice(0, 200)}`);
    }

    const data = (await resp.json()) as { access_token: string; expires_in?: number };
    const ttlMs = Math.max(((data.expires_in || 3599) - 300) * 1000, 60_000);
    tokenCache.set(tokenIndex, { token: data.access_token, expiresAt: now + ttlMs });
    return data.access_token;
  }

  static async request<T = any>(
    path: string,
    init: RequestInit = {},
    tokenIndex: 0 | 1 = 0
  ): Promise<T> {
    const token = await this.getAccessToken(tokenIndex);
    const url = path.startsWith('http') ? path : `https://api.zoom.us/v2${path}`;
    const resp = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });

    if (resp.status === 204) {
      return {} as T;
    }

    if (!resp.ok) {
      const errBody = await resp.text();
      throw new Error(`ZOOM_API_ERROR [${init.method || 'GET'} ${path}] (${resp.status}): ${errBody.slice(0, 300)}`);
    }

    return (await resp.json()) as T;
  }

  static verifyWebhookSignature(rawBody: string, timestampHeader?: string, signatureHeader?: string): boolean {
    const { webhookSecret } = this.getCredentials();
    if (!webhookSecret || !timestampHeader || !signatureHeader) return false;
    const message = `v0:${timestampHeader}:${rawBody}`;
    const hash = crypto.createHmac('sha256', webhookSecret).update(message).digest('hex');
    const expected = `v0=${hash}`;
    try {
      return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  static buildUrlValidationResponse(plainToken: string) {
    const { webhookSecret } = this.getCredentials();
    const encryptedToken = crypto.createHmac('sha256', webhookSecret).update(plainToken).digest('hex');
    return { plainToken, encryptedToken };
  }

  static async listAllAccountRooms() {
    const usersResp = await this.request<{ users: any[] }>('/users?page_size=50');
    const users = usersResp.users || [];
    const rooms: any[] = [];

    for (const u of users) {
      const [liveResp, schedResp] = await Promise.all([
        this.request<{ meetings: any[] }>(`/users/${u.id}/meetings?type=live&page_size=100`).catch(() => ({ meetings: [] })),
        this.request<{ meetings: any[] }>(`/users/${u.id}/meetings?type=scheduled&page_size=100`).catch(() => ({ meetings: [] })),
      ]);

      const seen = new Set<string>();
      for (const m of [...(liveResp.meetings || []), ...(schedResp.meetings || [])]) {
        const mid = String(m.id);
        if (seen.has(mid)) continue;
        seen.add(mid);
        try {
          const detail = await this.request<any>(`/meetings/${mid}`);
          rooms.push({
            id: String(detail.id),
            uuid: detail.uuid,
            topic: detail.topic || m.topic || '',
            type: detail.type,
            status: detail.status || 'waiting',
            hostId: u.id,
            hostEmail: u.email,
            hostDisplayName: u.display_name || `${u.first_name || ''} ${u.last_name || ''}`.trim(),
            hostLicenseType: u.type, // 2 = Licensed Business, 1 = Basic
            joinUrl: detail.join_url || '',
            password: detail.password || '',
            encryptedPassword: detail.encrypted_password || '',
            autoRecording: detail.settings?.auto_recording || 'none',
            recurrence: detail.recurrence || null,
            nextOccurrence: Array.isArray(detail.occurrences) && detail.occurrences.length > 0 ? detail.occurrences[0] : null,
            occurrencesCount: Array.isArray(detail.occurrences) ? detail.occurrences.length : 0,
            createdAt: detail.created_at || m.created_at,
          });
        } catch {
          rooms.push({
            id: mid,
            topic: m.topic || '',
            type: m.type,
            status: 'waiting',
            hostId: u.id,
            hostEmail: u.email,
            hostDisplayName: u.display_name || u.email,
            hostLicenseType: u.type,
            joinUrl: m.join_url || '',
            autoRecording: 'unknown',
            recurrence: null,
          });
        }
      }
    }

    return { users, rooms };
  }

  /**
   * Bẫy #4 của Zoom API: Tự động chia từng khung <= 28 ngày để lấy đầy đủ lịch sử Cloud Recordings
   */
  static async listCloudRecordingsRange(fromIso: string, toIso: string, userId = 'me'): Promise<any[]> {
    const start = new Date(`${fromIso}T00:00:00Z`);
    const end = new Date(`${toIso}T23:59:59Z`);
    const allMeetings: any[] = [];
    const seenUuids = new Set<string>();

    let cursor = new Date(start.getTime());
    while (cursor <= end) {
      const chunkEnd = new Date(Math.min(cursor.getTime() + 27 * 86400 * 1000, end.getTime()));
      const fStr = cursor.toISOString().slice(0, 10);
      const tStr = chunkEnd.toISOString().slice(0, 10);

      const resp = await this.request<{ meetings: any[] }>(
        `/users/${encodeURIComponent(userId)}/recordings?from=${fStr}&to=${tStr}&page_size=300`
      );
      for (const m of resp.meetings || []) {
        if (!seenUuids.has(m.uuid)) {
          seenUuids.add(m.uuid);
          allMeetings.push(m);
        }
      }
      cursor = new Date(chunkEnd.getTime() + 86400 * 1000);
    }

    return allMeetings;
  }
}
