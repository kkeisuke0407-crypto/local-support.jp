interface Env {
  RESEND_API_KEY: string;
}

const TO_ADDRESS = 'kkeisuke0407@gmail.com';
const FROM_ADDRESS = 'local-support.jp <contact@local-support.jp>';
const FIELD_LABELS: Record<string, string> = {
  service: 'サービス',
  company: '会社名・施設名',
  prefecture: '都道府県',
  city: '市区町村',
  facility_type: '施設の種類',
  tank_size: '貯水槽の容量',
  asbestos_level: 'アスベスト含有レベル',
  duct_type: 'ダクトの種類',
  shutter_type: 'シャッターの種類',
  urgency: '緊急度',
  schedule: '希望時期・時間帯',
  message: '補足メッセージ',
  name: '担当者名',
  email: '連絡先メール',
  tel: '連絡先電話',
  agree: '同意',
};

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isValidEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

interface QuotePayload {
  [key: string]: string;
}

function buildEmailHtml(data: QuotePayload): string {
  const rows = Object.entries(data)
    .filter(([k, v]) => k !== 'website' && v && v.trim() !== '')
    .map(([k, v]) => {
      const label = FIELD_LABELS[k] || k;
      const value = escapeHtml(v).replace(/\n/g, '<br>');
      return `<tr><th style="text-align:left;padding:8px 12px;background:#f3f4f6;border:1px solid #e5e7eb;width:160px;vertical-align:top;">${escapeHtml(label)}</th><td style="padding:8px 12px;border:1px solid #e5e7eb;">${value}</td></tr>`;
    })
    .join('');
  return `<!DOCTYPE html>
<html lang="ja"><body style="font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans',sans-serif;color:#1f2937;max-width:680px;margin:0 auto;padding:24px;">
<h2 style="color:#1d4ed8;border-bottom:2px solid #1d4ed8;padding-bottom:8px;">お見積もり依頼が届きました</h2>
<p style="font-size:14px;color:#6b7280;">local-support.jp の見積もりフォームから新しい依頼が届いています。</p>
<table style="border-collapse:collapse;width:100%;font-size:14px;margin-top:16px;">${rows}</table>
<p style="margin-top:24px;font-size:12px;color:#9ca3af;">このメールは自動送信です。返信する場合はお客様のメールアドレス宛にご連絡ください。</p>
</body></html>`;
}

function buildPlainText(data: QuotePayload): string {
  return Object.entries(data)
    .filter(([k, v]) => k !== 'website' && v && v.trim() !== '')
    .map(([k, v]) => `${FIELD_LABELS[k] || k}: ${v}`)
    .join('\n');
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const jsonResponse = (status: number, body: object) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    const formData = await context.request.formData();
    const data: QuotePayload = {};
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') data[key] = value;
    }

    if (data.website) {
      return jsonResponse(200, { ok: true });
    }

    if (!data.company || !data.email || !data.prefecture) {
      return jsonResponse(400, { ok: false, error: '必須項目が不足しています' });
    }
    if (!isValidEmail(data.email)) {
      return jsonResponse(400, { ok: false, error: 'メールアドレスの形式が正しくありません' });
    }

    const subject = `【お見積もり依頼】${data.service || ''} / ${data.company} / ${data.prefecture}`;
    const html = buildEmailHtml(data);
    const text = buildPlainText(data);

    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${context.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [TO_ADDRESS],
        reply_to: data.email,
        subject,
        html,
        text,
      }),
    });

    if (!resendResp.ok) {
      const errBody = await resendResp.text();
      console.error('Resend error:', resendResp.status, errBody);
      return jsonResponse(502, { ok: false, error: 'メール送信に失敗しました' });
    }

    return jsonResponse(200, { ok: true });
  } catch (err) {
    console.error('quote handler error:', err);
    return jsonResponse(500, { ok: false, error: 'サーバーエラーが発生しました' });
  }
};
