interface Env {
  RESEND_API_KEY: string;
}

const TO_ADDRESS = 'contact@local-support.jp';
const FROM_ADDRESS = 'local-support.jp <contact@local-support.jp>';

const FIELD_LABELS: Record<string, string> = {
  inquiry_type: 'お問い合わせ種別',
  name: 'お名前',
  company: '会社・媒体名',
  email: 'メールアドレス',
  tel: '電話番号',
  message: 'お問い合わせ内容',
  agree: '同意',
  utm_source: '流入元(utm_source)',
  utm_medium: '流入媒体(utm_medium)',
  utm_campaign: 'キャンペーン(utm_campaign)',
  referrer: 'リファラ',
  landing_path: '着地ページ',
};

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isValidEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidTel = (v: string): boolean => {
  const digits = v.replace(/[-ー－\s()（）]/g, '');
  return /^\+?\d{10,15}$/.test(digits);
};

interface ContactPayload {
  [key: string]: string;
}

function buildEmailHtml(data: ContactPayload): string {
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
<h2 style="color:#1d4ed8;border-bottom:2px solid #1d4ed8;padding-bottom:8px;">取材・提携の問い合わせが届きました</h2>
<p style="font-size:14px;color:#6b7280;">local-support.jp のお問い合わせフォームから新しい問い合わせが届いています。</p>
<table style="border-collapse:collapse;width:100%;font-size:14px;margin-top:16px;">${rows}</table>
<p style="margin-top:24px;font-size:12px;color:#9ca3af;">このメールは自動送信です。返信する場合はお客様のメールアドレス宛にご連絡ください。</p>
</body></html>`;
}

function buildPlainText(data: ContactPayload): string {
  return Object.entries(data)
    .filter(([k, v]) => k !== 'website' && v && v.trim() !== '')
    .map(([k, v]) => `${FIELD_LABELS[k] || k}: ${v}`)
    .join('\n');
}

function buildUserReplyHtml(data: ContactPayload): string {
  const summaryKeys = ['inquiry_type', 'name', 'company', 'email', 'tel', 'message'];
  const rows = summaryKeys
    .filter((k) => data[k] && data[k].trim() !== '')
    .map((k) => {
      const label = FIELD_LABELS[k] || k;
      const value = escapeHtml(data[k]).replace(/\n/g, '<br>');
      return `<tr><th style="text-align:left;padding:8px 12px;background:#f3f4f6;border:1px solid #e5e7eb;width:160px;vertical-align:top;font-weight:600;">${escapeHtml(label)}</th><td style="padding:8px 12px;border:1px solid #e5e7eb;">${value}</td></tr>`;
    })
    .join('');
  const nameLine = data.name ? `${escapeHtml(data.name)} 様` : 'ご担当者様';
  return `<!DOCTYPE html>
<html lang="ja"><body style="font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans',sans-serif;color:#1f2937;max-width:680px;margin:0 auto;padding:24px;line-height:1.7;">
<h2 style="color:#1d4ed8;border-bottom:2px solid #1d4ed8;padding-bottom:8px;">お問い合わせを受け付けました</h2>
<p>${nameLine}</p>
<p>このたびは local-support.jp（ロカサポ）にお問い合わせいただき、誠にありがとうございます。<br>下記の内容で受け付けましたのでご連絡いたします。</p>

<p style="font-size:14px;color:#374151;">通常2〜3営業日以内にご返信いたします（土日祝を除く）。お急ぎの場合や1週間以上ご返信がない場合は、お手数ですが再度お問い合わせください。</p>

<h3 style="font-size:15px;margin-top:24px;color:#1f2937;">お問い合わせ内容（控え）</h3>
<table style="border-collapse:collapse;width:100%;font-size:14px;margin-top:8px;">${rows}</table>

<p style="margin-top:32px;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px;">
このメールは送信専用アドレスから自動送信されています。<br>
追加のご連絡はフォームよりお願いいたします。<br>
<br>
ロカサポ（運営：ローカル情報局）<br>
<a href="https://local-support.jp/" style="color:#1d4ed8;">https://local-support.jp/</a>
</p>
</body></html>`;
}

function buildUserReplyText(data: ContactPayload): string {
  const summaryKeys = ['inquiry_type', 'name', 'company', 'email', 'tel', 'message'];
  const summary = summaryKeys
    .filter((k) => data[k] && data[k].trim() !== '')
    .map((k) => `  ${FIELD_LABELS[k] || k}: ${data[k]}`)
    .join('\n');
  const nameLine = data.name ? `${data.name} 様` : 'ご担当者様';
  return `${nameLine}

このたびは local-support.jp（ロカサポ）にお問い合わせいただき、誠にありがとうございます。
下記の内容で受け付けましたのでご連絡いたします。

通常2〜3営業日以内にご返信いたします（土日祝を除く）。
お急ぎの場合や1週間以上ご返信がない場合は、お手数ですが再度お問い合わせください。

■ お問い合わせ内容（控え）
${summary}

────────────────────────
このメールは送信専用アドレスから自動送信されています。
追加のご連絡はフォームよりお願いいたします。

ロカサポ（運営：ローカル情報局）
https://local-support.jp/
`;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const jsonResponse = (status: number, body: object) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    const formData = await context.request.formData();
    const data: ContactPayload = {};
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') data[key] = value;
    }

    if (data.website) {
      return jsonResponse(200, { ok: true });
    }

    if (!data.inquiry_type || !data.name || !data.email || !data.message) {
      return jsonResponse(400, { ok: false, error: '必須項目が不足しています' });
    }
    if (!isValidEmail(data.email)) {
      return jsonResponse(400, { ok: false, error: 'メールアドレスの形式が正しくありません' });
    }
    if (data.tel && !isValidTel(data.tel)) {
      return jsonResponse(400, { ok: false, error: '電話番号の形式が正しくありません' });
    }
    if (data.agree !== undefined && data.agree !== 'on' && data.agree !== 'true' && data.agree !== '1') {
      return jsonResponse(400, { ok: false, error: 'プライバシーポリシーへの同意が必要です' });
    }

    const subjectName = data.company ? `${data.name}（${data.company}）` : data.name;
    const subject = `【取材・提携】${data.inquiry_type} / ${subjectName}`;
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
      console.error('Resend error (contact):', resendResp.status, errBody);
      return jsonResponse(502, { ok: false, error: 'メール送信に失敗しました' });
    }

    // ユーザー宛の受付確認メール（失敗してもメイン処理は成功扱い）
    try {
      const userReplyResp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${context.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to: [data.email],
          subject: '【local-support.jp】お問い合わせを受け付けました',
          html: buildUserReplyHtml(data),
          text: buildUserReplyText(data),
        }),
      });
      if (!userReplyResp.ok) {
        const errBody = await userReplyResp.text();
        console.error('User reply send failed (contact):', userReplyResp.status, errBody);
      }
    } catch (replyErr) {
      console.error('User reply send error (contact):', replyErr);
    }

    return jsonResponse(200, { ok: true });
  } catch (err) {
    console.error('contact handler error:', err);
    return jsonResponse(500, { ok: false, error: 'サーバーエラーが発生しました' });
  }
};
