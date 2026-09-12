#!/usr/bin/env python3
"""docs/sheet-tab1-cases.csv と tab2 から一覧用サマリを生成する。

  python3 scripts/build-summary.py

出力: docs/sheet-tab0-summary.csv（スプシの「サマリ」タブ）
案件の状態を tab2 の実データから毎回計算し直すので、手で直す必要はない。
"""
import csv, datetime, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
T1 = ROOT / 'docs/sheet-tab1-cases.csv'
T2 = ROOT / 'docs/sheet-tab2-quotes.csv'
OUT = ROOT / 'docs/sheet-tab0-summary.csv'

TODAY = datetime.date.today()

# 決着済みと判定するステータスの手がかり
CLOSED = ('成約', '失注', 'クローズ', '★依頼者が選定', '連絡先共有済')


def load(path):
    rows = list(csv.reader(path.open(encoding='utf-8')))
    return rows[0], rows[1:]


def days_since(s):
    m = re.match(r'(\d{4})-(\d{2})-(\d{2})', s or '')
    if not m:
        return ''
    d = datetime.date(*map(int, m.groups()))
    return (TODAY - d).days


def main():
    h1, cases = load(T1)
    h2, quotes = load(T2)
    C1 = {n: i for i, n in enumerate(h1)}
    C2 = {n: i for i, n in enumerate(h2)}

    # 案件IDごとに業者行を集計
    tally = {}
    for r in quotes:
        t = tally.setdefault(r[0], {'打診': 0, '紹介可': 0, '辞退': 0, '不達': 0, '未依頼': 0, '回答待ち': 0})
        s = r[C2['見積ステータス']]
        if s == '未依頼':
            t['未依頼'] += 1
            continue
        if s in ('対象外', '送信保留'):
            continue
        t['打診'] += 1
        if s.startswith('紹介可'):
            t['紹介可'] += 1
        elif s == '辞退':
            t['辞退'] += 1
        elif s == '不達':
            t['不達'] += 1
        else:
            t['回答待ち'] += 1

    out = []
    for r in cases:
        cid = r[0]
        t = tally.get(cid, {'打診': 0, '紹介可': 0, '辞退': 0, '不達': 0, '未依頼': 0, '回答待ち': 0})
        status = r[C1['ステータス']]
        closed = any(k in status for k in CLOSED)

        if closed:
            mark, rank, act = '✅ 決着', 6, '—'
        elif t['打診'] == 0:
            mark, rank = '🚨 未打診', 0
            act = f"業者を選んで打診する（候補{t['未依頼']}件）" if t['未依頼'] else '業者候補の選定から'
        elif t['紹介可'] == 0:
            mark, rank = '🔴 回答ゼロ', 1
            act = f"督促＋打診先の追加（未依頼{t['未依頼']}件）" if t['未依頼'] else '督促＋打診先を探す'
        elif t['紹介可'] == 1:
            mark, rank = '🟡 あと1社', 2
            act = f"2社目を取る（未依頼{t['未依頼']}件）" if t['未依頼'] else '2社目を取る（候補の追加が必要）'
        elif '比較ページ送付' in status or '提示' in status:
            mark, rank, act = '📤 選定待ち', 5, '依頼者の選定を待つ'
        else:
            mark, rank, act = '🟢 比較可能', 3, '比較ページを作って依頼者へ送る'

        out.append([
            str(rank), mark, cid,
            r[C1['サービス']], r[C1['エリア']],
            r[C1['受付日']], str(days_since(r[C1['受付日']])),
            str(t['打診']), str(t['紹介可']), str(t['回答待ち']),
            str(t['辞退'] + t['不達']), str(t['未依頼']),
            act, status,
        ])

    out.sort(key=lambda x: (x[0], -int(x[6] or 0)))
    for r in out:
        del r[0]  # 並べ替え用の rank は出力しない

    header = ['状態', '案件ID', 'サービス', 'エリア', '受付日', '経過日数',
              '打診', '紹介可', '回答待ち', '辞退不達', '未依頼', '次の一手', '詳細ステータス']
    with OUT.open('w', encoding='utf-8', newline='') as f:
        csv.writer(f, lineterminator='\n').writerows([header] + out)

    print(f'{OUT.name}: {len(out)}件')
    for r in out:
        print(f'  {r[0]:12s} {r[1]:22s} {r[5]:>3s}日  打診{r[6]:>3s} 可{r[7]:>2s} 待{r[8]:>3s} 未依頼{r[10]:>2s}  {r[11]}')


if __name__ == '__main__':
    sys.exit(main())
