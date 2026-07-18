interface Env {
  RESEND_API_KEY: string;
}

const TO_ADDRESS = 'contact@local-support.jp';
const FROM_ADDRESS = 'ロカサポ <contact@local-support.jp>';

interface HearingAnswer {
  key: string;
  label: string;
  value: string;
}

interface HearingPayload {
  request_id: string;
  service: string;
  service_slug?: string;
  facility_type: string;
  prefecture: string;
  requester_name: string;
  requester_email: string;
  requester_tel: string;
  answers: HearingAnswer[];
}

function escapeHtml(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function jsonResponse(status: number, body: object): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function buildOpsHtml(p: HearingPayload): string {
  const rows = (p.answers || [])
    .filter((a) => a && a.value && a.value.trim() !== '')
    .map((a) => {
      const value = escapeHtml(a.value).replace(/\n/g, '<br>');
      return `<tr><th style="text-align:left;padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;width:200px;vertical-align:top;">${escapeHtml(a.label || a.key)}</th><td style="padding:8px 12px;border:1px solid #e5e7eb;">${value}</td></tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="ja"><body style="font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans',sans-serif;color:#1f2937;max-width:720px;margin:0 auto;padding:24px;">
<h2 style="color:#1d4ed8;border-bottom:2px solid #1d4ed8;padding-bottom:8px;">事前ヒアリング回答が届きました（運営オペ用）</h2>
<p style="font-size:14px;color:#6b7280;">依頼者が事前ヒアリングページで詳細情報を回答しました。この情報をもとに業者選定を進めてください。</p>

<table style="border-collapse:collapse;width:100%;font-size:14px;margin-top:16px;">
<tr><th style="text-align:left;padding:8px 12px;background:#fef3c7;border:1px solid #fde68a;width:160px;">案件ID</th><td style="padding:8px 12px;border:1px solid #fde68a;background:#fffbeb;"><strong>${escapeHtml(p.request_id)}</strong></td></tr>
<tr><th style="text-align:left;padding:8px 12px;background:#f3f4f6;border:1px solid #e5e7eb;">サービス</th><td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(p.service)}</td></tr>
<tr><th style="text-align:left;padding:8px 12px;background:#f3f4f6;border:1px solid #e5e7eb;">施設の種類</th><td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(p.facility_type)}</td></tr>
<tr><th style="text-align:left;padding:8px 12px;background:#f3f4f6;border:1px solid #e5e7eb;">地域</th><td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(p.prefecture)}</td></tr>
<tr><th style="text-align:left;padding:8px 12px;background:#f3f4f6;border:1px solid #e5e7eb;">ご依頼者</th><td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(p.requester_name)}</td></tr>
<tr><th style="text-align:left;padding:8px 12px;background:#f3f4f6;border:1px solid #e5e7eb;">メール</th><td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(p.requester_email)}</td></tr>
<tr><th style="text-align:left;padding:8px 12px;background:#f3f4f6;border:1px solid #e5e7eb;">電話</th><td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(p.requester_tel)}</td></tr>
</table>

<h3 style="font-size:15px;margin-top:24px;color:#1f2937;">ヒアリング回答</h3>
<table style="border-collapse:collapse;width:100%;font-size:14px;margin-top:8px;">${rows}</table>

<p style="margin-top:32px;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px;">
local-support.jp の事前ヒアリングページからの自動通知です。<br/>
このメールに返信しても依頼者には届きません。
</p>
</body></html>`;
}

function buildUserConfirmHtml(p: HearingPayload): string {
  return `<!DOCTYPE html>
<html lang="ja"><body style="font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans',sans-serif;color:#1f2937;max-width:680px;margin:0 auto;padding:24px;line-height:1.7;">
<h2 style="color:#1d4ed8;border-bottom:2px solid #1d4ed8;padding-bottom:8px;">事前ヒアリングのご回答ありがとうございました</h2>
<p>${escapeHtml(p.requester_name || 'ご依頼者')} 様</p>
<p>このたびはロカサポをご利用いただき、誠にありがとうございます。<br/>事前ヒアリングのご回答を確かに受け付けました。</p>

<h3 style="font-size:15px;margin-top:24px;color:#1f2937;">今後の流れ</h3>
<ol style="padding-left:20px;font-size:14px;">
  <li>いただいた情報をもとに、ロカサポ運営事務局が条件に合う業者を選定します。</li>
  <li>業者の概算見積が揃いましたら、業者を比較できる専用ページのURLをメールでお送りします（通常 3〜7営業日）。</li>
  <li>比較ページから連絡を希望する業者を1〜3社お選びください。</li>
</ol>

<p style="font-size:13px;color:#6b7280;">※ 業者をお選びいただくまで、業者からの直接のご連絡はありません。</p>

<h3 style="font-size:15px;margin-top:24px;color:#1f2937;">案件情報</h3>
<table style="border-collapse:collapse;width:100%;font-size:14px;">
<tr><th style="text-align:left;padding:6px 12px;background:#f3f4f6;border:1px solid #e5e7eb;width:120px;">案件ID</th><td style="padding:6px 12px;border:1px solid #e5e7eb;">${escapeHtml(p.request_id)}</td></tr>
<tr><th style="text-align:left;padding:6px 12px;background:#f3f4f6;border:1px solid #e5e7eb;">サービス</th><td style="padding:6px 12px;border:1px solid #e5e7eb;">${escapeHtml(p.service)}</td></tr>
</table>

<p style="margin-top:32px;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px;">
このメールは送信専用アドレスから自動送信されています。<br/>
ご質問は <a href="mailto:support@local-support.jp" style="color:#1d4ed8;">support@local-support.jp</a> までご連絡ください。<br/>
<br/>
local-support.jp（運営：ローカル情報局）<br/>
<a href="https://local-support.jp/" style="color:#1d4ed8;">https://local-support.jp/</a>
</p>
</body></html>`;
}

async function sendEmail(env: Env, to: string, subject: string, html: string): Promise<void> {
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html }),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Resend ${resp.status}: ${errText}`);
  }
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const origin = context.request.headers.get('origin') || '';
    if (origin && !/^https?:\/\/(www\.)?local-support\.jp$/.test(origin)) {
      return jsonResponse(403, { ok: false, error: '不正なリクエストです' });
    }

    const data = (await context.request.json()) as HearingPayload;

    if (!data.request_id || !data.service || !Array.isArray(data.answers) || data.answers.length === 0) {
      return jsonResponse(400, { ok: false, error: '案件情報が不足しています' });
    }

    const opsSubject = `【事前ヒアリング回答】${data.request_id} ${data.service}（${data.prefecture}）`;
    await sendEmail(context.env, TO_ADDRESS, opsSubject, buildOpsHtml(data));

    if (data.requester_email && isValidEmail(data.requester_email)) {
      const userSubject = `【ロカサポ】事前ヒアリングを受け付けました（${data.request_id}）`;
      try {
        await sendEmail(context.env, data.requester_email, userSubject, buildUserConfirmHtml(data));
      } catch (e) {
        console.error('user confirm email failed', e);
      }
    }

    return jsonResponse(200, { ok: true });
  } catch (err) {
    console.error('hearing error', err);
    return jsonResponse(500, { ok: false, error: 'サーバーエラーが発生しました' });
  }
};
