interface Env {
  RESEND_API_KEY: string;
}

const TO_ADDRESS = 'contact@local-support.jp';
const FROM_ADDRESS = 'ロカサポ <contact@local-support.jp>';

interface SelectedVendor {
  id: string;
  name: string;
  estimatedPrice?: string;
}

interface SelectVendorPayload {
  request_id: string;
  service: string;
  prefecture: string;
  requester_name: string;
  requester_email: string;
  requester_tel: string;
  message: string;
  selected_vendors: SelectedVendor[];
  all_vendor_ids: string[];
}

function escapeHtml(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function jsonResponse(status: number, body: object): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function buildOpsHtml(p: SelectVendorPayload): string {
  const selectedRows = p.selected_vendors
    .map((v, i) => `<tr>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;width:40px;background:#f3f4f6;text-align:center;font-weight:700;">${i + 1}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;"><strong>${escapeHtml(v.id)}</strong>：${escapeHtml(v.name)}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(v.estimatedPrice || '—')}</td>
    </tr>`)
    .join('');

  const allIds = p.all_vendor_ids.join(', ');
  const selectedIdSet = new Set(p.selected_vendors.map((v) => v.id));
  const droppedIds = p.all_vendor_ids.filter((id) => !selectedIdSet.has(id)).join(', ') || '（なし）';

  return `<!DOCTYPE html>
<html lang="ja"><body style="font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans',sans-serif;color:#1f2937;max-width:720px;margin:0 auto;padding:24px;">
<h2 style="color:#1d4ed8;border-bottom:2px solid #1d4ed8;padding-bottom:8px;">業者選定が確定しました（運営オペ用）</h2>
<p style="font-size:14px;color:#6b7280;">依頼者が業者比較ページで業者を選定しました。下記業者へ連絡先共有・紹介プロセスを開始してください。</p>

<table style="border-collapse:collapse;width:100%;font-size:14px;margin-top:16px;">
<tr><th style="text-align:left;padding:8px 12px;background:#fef3c7;border:1px solid #fde68a;width:160px;">案件ID</th><td style="padding:8px 12px;border:1px solid #fde68a;background:#fffbeb;"><strong>${escapeHtml(p.request_id)}</strong></td></tr>
<tr><th style="text-align:left;padding:8px 12px;background:#f3f4f6;border:1px solid #e5e7eb;">サービス</th><td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(p.service)}</td></tr>
<tr><th style="text-align:left;padding:8px 12px;background:#f3f4f6;border:1px solid #e5e7eb;">地域</th><td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(p.prefecture)}</td></tr>
<tr><th style="text-align:left;padding:8px 12px;background:#f3f4f6;border:1px solid #e5e7eb;">ご依頼者名</th><td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(p.requester_name)}</td></tr>
<tr><th style="text-align:left;padding:8px 12px;background:#f3f4f6;border:1px solid #e5e7eb;">ご依頼者メール</th><td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(p.requester_email)}</td></tr>
<tr><th style="text-align:left;padding:8px 12px;background:#f3f4f6;border:1px solid #e5e7eb;">ご依頼者電話</th><td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(p.requester_tel)}</td></tr>
</table>

<h3 style="font-size:15px;margin-top:24px;color:#1f2937;">選定された業者（連絡先共有OK）</h3>
<table style="border-collapse:collapse;width:100%;font-size:14px;margin-top:8px;">
  <thead><tr><th style="padding:8px 12px;background:#dcfce7;border:1px solid #86efac;text-align:left;width:40px;">No</th><th style="padding:8px 12px;background:#dcfce7;border:1px solid #86efac;text-align:left;">業者</th><th style="padding:8px 12px;background:#dcfce7;border:1px solid #86efac;text-align:left;">概算見積</th></tr></thead>
  <tbody>${selectedRows}</tbody>
</table>

${p.message ? `<h3 style="font-size:15px;margin-top:24px;color:#1f2937;">依頼者からのメッセージ</h3>
<div style="padding:14px;background:#f9fafb;border-left:4px solid #1d4ed8;border-radius:4px;font-size:14px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(p.message)}</div>` : ''}

<h3 style="font-size:15px;margin-top:24px;color:#6b7280;">参考：今回紹介した全業者ID</h3>
<p style="font-size:13px;color:#6b7280;">全業者：${escapeHtml(allIds)}<br/>選定外（連絡共有しない）：${escapeHtml(droppedIds)}</p>

<p style="margin-top:32px;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px;">
local-support.jp の業者比較ページからの自動通知です。<br/>
このメールに返信しても依頼者には届きません。
</p>
</body></html>`;
}

function buildUserConfirmHtml(p: SelectVendorPayload): string {
  const list = p.selected_vendors
    .map((v, i) => `<li><strong>${escapeHtml(v.name)}</strong>${v.estimatedPrice ? `（${escapeHtml(v.estimatedPrice)}）` : ''}</li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="ja"><body style="font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans',sans-serif;color:#1f2937;max-width:680px;margin:0 auto;padding:24px;line-height:1.7;">
<h2 style="color:#1d4ed8;border-bottom:2px solid #1d4ed8;padding-bottom:8px;">業者選定を受け付けました</h2>
<p>${escapeHtml(p.requester_name || 'ご依頼者')} 様</p>
<p>このたびはロカサポをご利用いただき、誠にありがとうございます。<br/>下記の業者を選定いただいたことを確認いたしました。</p>

<h3 style="font-size:15px;margin-top:24px;color:#1f2937;">選定された業者</h3>
<ul style="padding-left:20px;font-size:14px;">${list}</ul>

<h3 style="font-size:15px;margin-top:24px;color:#1f2937;">今後の流れ</h3>
<ol style="padding-left:20px;font-size:14px;">
  <li>ロカサポ運営事務局より、選定された業者へ連絡先（メール・電話）をお伝えします（通常1営業日以内）。</li>
  <li>業者から直接ご連絡が入りますので、詳細なご要件をご相談ください。</li>
  <li>最終見積を比較し、納得いただける業者とご契約ください。</li>
</ol>

<p style="font-size:13px;color:#6b7280;">※ 選定されなかった業者には連絡先は共有されません。<br/>
※ 業者からのご連絡が確認できない場合は、迷惑メールフォルダもあわせてご確認ください。</p>

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
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [to],
      subject,
      html,
    }),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Resend ${resp.status}: ${errText}`);
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // Origin validation（同一サイトからのリクエストのみ受け付ける）
    const origin = context.request.headers.get('origin') || '';
    if (origin && !/^https?:\/\/(www\.)?local-support\.jp$/.test(origin)) {
      return jsonResponse(403, { ok: false, error: '不正なリクエストです' });
    }

    const data = (await context.request.json()) as SelectVendorPayload;

    // 最低限のバリデーション
    if (!data.request_id || !data.service) {
      return jsonResponse(400, { ok: false, error: '案件情報が不足しています' });
    }
    if (!Array.isArray(data.selected_vendors) || data.selected_vendors.length < 1 || data.selected_vendors.length > 3) {
      return jsonResponse(400, { ok: false, error: '業者は1〜3社を選択してください' });
    }

    // 運営オペ宛
    const opsSubject = `【選定確定】${data.request_id} ${data.service}（${data.prefecture}）${data.selected_vendors.length}社`;
    await sendEmail(context.env, TO_ADDRESS, opsSubject, buildOpsHtml(data));

    // 依頼者宛（メアドがあれば確認メールを送る）
    if (data.requester_email && isValidEmail(data.requester_email)) {
      const userSubject = `【ロカサポ】業者選定を受け付けました（${data.request_id}）`;
      try {
        await sendEmail(context.env, data.requester_email, userSubject, buildUserConfirmHtml(data));
      } catch (e) {
        // 確認メール失敗は致命的でないのでログのみ
        console.error('user confirm email failed', e);
      }
    }

    return jsonResponse(200, { ok: true });
  } catch (err) {
    console.error('select-vendor error', err);
    return jsonResponse(500, { ok: false, error: 'サーバーエラーが発生しました' });
  }
};
