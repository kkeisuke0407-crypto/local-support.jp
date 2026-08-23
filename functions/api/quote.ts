interface Env {
  RESEND_API_KEY: string;
}

const TO_ADDRESS = 'contact@local-support.jp';
const FROM_ADDRESS = 'ロカサポ <contact@local-support.jp>';
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
  contact_method: '希望の連絡方法',
  email: '連絡先メール',
  tel: '連絡先電話',
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

// UTF-8 文字列を base64url へ（/hearing/ /quote-result/ のデコード方式に一致）
const b64urlEncodeUtf8 = (str: string): string => {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

// フォーム内容から事前ヒアリングページのURLを自動生成（全依頼者を必須ヒアリングへ誘導）
const buildHearingUrl = (data: QuotePayload): string => {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase();
  const payload = {
    id: `WEB-${ymd}-${rand}`,
    service: data.service || '',
    serviceSlug: data.service_slug || '',
    facilityType: data.facility_type || '',
    prefecture: data.prefecture || '',
    requester: { name: data.name || data.company || '', email: data.email || '', tel: data.tel || '' },
  };
  return `https://local-support.jp/hearing/#data=${b64urlEncodeUtf8(JSON.stringify(payload))}`;
};

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

function buildUserReplyHtml(data: QuotePayload, hearingUrl: string): string {
  const summaryKeys = ['service', 'company', 'prefecture', 'city', 'facility_type', 'urgency', 'schedule', 'name', 'email', 'tel'];
  const rows = summaryKeys
    .filter((k) => data[k] && data[k].trim() !== '')
    .map((k) => {
      const label = FIELD_LABELS[k] || k;
      const value = escapeHtml(data[k]).replace(/\n/g, '<br>');
      return `<tr><th style="text-align:left;padding:8px 12px;background:#f3f4f6;border:1px solid #e5e7eb;width:160px;vertical-align:top;font-weight:600;">${escapeHtml(label)}</th><td style="padding:8px 12px;border:1px solid #e5e7eb;">${value}</td></tr>`;
    })
    .join('');
  const nameLine = data.name ? `${escapeHtml(data.name)} 様` : `${escapeHtml(data.company)} 御中`;
  return `<!DOCTYPE html>
<html lang="ja"><body style="font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans',sans-serif;color:#1f2937;max-width:680px;margin:0 auto;padding:24px;line-height:1.7;">
<h2 style="color:#1d4ed8;border-bottom:2px solid #1d4ed8;padding-bottom:8px;">お見積もり依頼を受け付けました</h2>
<p>${nameLine}</p>
<p>このたびは local-support.jp をご利用いただき、誠にありがとうございます。<br>下記の内容でお見積もり依頼を受け付けましたのでご連絡いたします。</p>

<div style="margin:20px 0;padding:16px 18px;background:#fffbeb;border:1.5px solid #f59e0b;border-radius:8px;">
<p style="margin:0 0 6px;font-weight:700;color:#92400e;">【重要】まず事前ヒアリングへのご回答をお願いします（約1〜2分）</p>
<p style="margin:0 0 12px;font-size:14px;">施設の規模や現状など詳細をお伺いすることで、<strong>業者が正確なお見積もりを提示できます</strong>。この回答をもって業者への打診を開始しますので、ぜひご協力ください。</p>
<a href="${hearingUrl}" style="display:inline-block;background:#f59e0b;color:#1a1a1a;font-weight:700;padding:12px 26px;border-radius:6px;text-decoration:none;">事前ヒアリングに回答する</a>
</div>

<h3 style="font-size:15px;margin-top:24px;color:#1f2937;">今後の流れ</h3>
<ol style="padding-left:20px;font-size:14px;">
  <li><strong>上記の事前ヒアリングにご回答ください</strong>（正確な見積もりの前提になります）。</li>
  <li>ご回答をもとに、対応可能な実績・信頼のある専門業者へお声がけします（1営業日以内に打診開始）。</li>
  <li>業者の対応可否・対応条件の回答を取りまとめます（通常 3〜7営業日）。</li>
  <li>業者の資格・実績・対応条件を一覧で確認できる「業者比較ページ」のURLをご案内します（概算を提示できる業者は目安金額も掲載します）。</li>
  <li>比較ページから連絡を希望する業者を1〜5社お選びください。<strong>選択した業者にのみ連絡先が共有されます。</strong></li>
  <li>選定された業者からご連絡が入ります（選定後 1〜3営業日）。最終見積を比較してご契約ください。</li>
</ol>
<p style="font-size:13px;color:#6b7280;">※ お急ぎの場合はフォームの「緊急度」欄でその旨をお知らせください。早期回答可能な業者から優先的にお声がけします。<br>※ 土日祝のお申し込みは翌営業日以降の対応開始となります。<br>※ <strong>業者をお選びいただくまで、業者からの直接のご連絡は一切ありません。</strong></p>

<h3 style="font-size:15px;margin-top:24px;color:#1f2937;">ご依頼内容（控え）</h3>
<table style="border-collapse:collapse;width:100%;font-size:14px;margin-top:8px;">${rows}</table>

<p style="margin-top:32px;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px;">
このメールは送信専用アドレスから自動送信されています。<br>
内容についてのお問い合わせは、各サービスページのフォームよりご連絡ください。<br>
<br>
local-support.jp（運営：ローカル情報局）<br>
<a href="https://local-support.jp/" style="color:#1d4ed8;">https://local-support.jp/</a>
</p>
</body></html>`;
}

function buildUserReplyText(data: QuotePayload, hearingUrl: string): string {
  const summaryKeys = ['service', 'company', 'prefecture', 'city', 'facility_type', 'urgency', 'schedule', 'name', 'email', 'tel'];
  const summary = summaryKeys
    .filter((k) => data[k] && data[k].trim() !== '')
    .map((k) => `  ${FIELD_LABELS[k] || k}: ${data[k]}`)
    .join('\n');
  const nameLine = data.name ? `${data.name} 様` : `${data.company} 御中`;
  return `${nameLine}

このたびは local-support.jp をご利用いただき、誠にありがとうございます。
下記の内容でお見積もり依頼を受け付けましたのでご連絡いたします。

━━━━━━━━━━━━━━━━━━━━
【重要】まず事前ヒアリングへのご回答をお願いします（約1〜2分）
施設の規模・現状などの詳細をお伺いすることで、業者が正確なお見積もりを
提示できます。この回答をもって業者への打診を開始します。
▼ 事前ヒアリング
${hearingUrl}
━━━━━━━━━━━━━━━━━━━━

■ 今後の流れ
  1. 上記の事前ヒアリングにご回答ください（正確な見積もりの前提になります）。
  2. ご回答をもとに、対応可能な実績・信頼のある専門業者へお声がけします（1営業日以内に打診開始）。
  3. 業者の対応可否・対応条件の回答を取りまとめます（通常 3〜7営業日）。
  4. 業者の資格・実績・対応条件を一覧で確認できる「業者比較ページ」のURLをご案内します（概算を提示できる業者は目安金額も掲載します）。
  5. 比較ページから連絡を希望する業者を1〜5社お選びください。選択した業者にのみ連絡先が共有されます。
  6. 選定された業者からご連絡が入り、最終見積を比較してご契約ください。

※ お急ぎの場合はフォームの「緊急度」欄でその旨をお知らせください。早期回答可能な業者から優先的にお声がけします。
※ 土日祝のお申し込みは翌営業日以降の対応開始となります。
※ 業者をお選びいただくまで、業者からの直接のご連絡は一切ありません。

■ ご依頼内容（控え）
${summary}

────────────────────────
このメールは送信専用アドレスから自動送信されています。
内容についてのお問い合わせは、各サービスページのフォームよりご連絡ください。

local-support.jp（運営：ローカル情報局）
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
    // 簡易ボット対策：正規ブラウザの同一オリジン送信は Origin ヘッダを必ず送る。
    // Origin が存在し、かつ自サイト以外なら拒否（直接POSTするボットを弾く）。
    const origin = context.request.headers.get('Origin');
    if (origin && !/^https?:\/\/(www\.)?local-support\.jp$/.test(origin)) {
      return jsonResponse(403, { ok: false, error: '不正なリクエストです' });
    }

    const formData = await context.request.formData();
    const data: QuotePayload = {};
    for (const [key, value] of formData.entries()) {
      if (typeof value !== 'string') continue;
      if (key === 'additional_services') continue;
      data[key] = value;
    }
    // 複数選択の追加サービスを service フィールドにマージ
    const additional = formData.getAll('additional_services').filter((v): v is string => typeof v === 'string' && v.trim() !== '');
    if (additional.length > 0) {
      const baseService = (data.service || '').trim();
      const combined = baseService ? [baseService, ...additional] : additional;
      data.service = combined.join('、');
    }

    if (data.website) {
      return jsonResponse(200, { ok: true });
    }

    if (!data.company || !data.prefecture) {
      return jsonResponse(400, { ok: false, error: '必須項目が不足しています' });
    }

    // 市区町村は業者選定の前提。都道府県だけだと拠点からの距離が判断できず、
    // 受付後にメールで聞き直す往復が発生する（PCO-2026-0823-001 で実際に発生）
    if (!data.city) {
      return jsonResponse(400, { ok: false, error: '市区町村を入力してください' });
    }

    // メールアドレスは受付時に必ず取得する（比較ページ送付・運営連絡に不可欠）
    if (!data.email) {
      return jsonResponse(400, { ok: false, error: 'メールアドレスを入力してください' });
    }
    // 業者からの連絡方法が「電話」「どちらでも」の場合は電話番号も必須
    const method = data.contact_method;
    if ((method === '電話' || method === 'どちらでも') && !data.tel) {
      return jsonResponse(400, { ok: false, error: '電話番号を入力してください' });
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
        ...(data.email ? { reply_to: data.email } : {}),
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

    // ユーザー宛の受付確認メール（メールアドレスがある場合のみ・失敗してもメイン処理は成功扱い）
    if (data.email) try {
      const hearingUrl = buildHearingUrl(data);
      const userReplyResp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${context.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to: [data.email],
          subject: '【ロカサポ】お見積もり依頼を受け付けました（まず事前ヒアリングのお願い）',
          html: buildUserReplyHtml(data, hearingUrl),
          text: buildUserReplyText(data, hearingUrl),
        }),
      });
      if (!userReplyResp.ok) {
        const errBody = await userReplyResp.text();
        console.error('User reply send failed:', userReplyResp.status, errBody);
      }
    } catch (replyErr) {
      console.error('User reply send error:', replyErr);
    }

    return jsonResponse(200, { ok: true });
  } catch (err) {
    console.error('quote handler error:', err);
    return jsonResponse(500, { ok: false, error: 'サーバーエラーが発生しました' });
  }
};
