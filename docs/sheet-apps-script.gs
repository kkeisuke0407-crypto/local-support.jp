/**
 * ロカサポ 案件トラッカー — GitHub の CSV をスプレッドシートへ自動同期
 *
 * 【セットアップ（一度だけ）】
 * 1. スプレッドシートを開く → 拡張機能 → Apps Script
 * 2. 既定の Code.gs の中身を消して、このファイルの内容を全部貼り付ける
 * 3. 保存 → 関数の選択で syncAll を選び「実行」→ 初回だけ承認を求められるので許可
 * 4. 左メニューの時計アイコン（トリガー）→ トリガーを追加
 *      実行する関数: syncAll
 *      イベントのソース: 時間主導型
 *      時間ベースのトリガーのタイプ: 時間ベースのタイマー
 *      時間の間隔: 1時間おき
 *    → 保存
 *
 * 以降、1時間ごとに main ブランチの CSV を取り込んでタブを更新する。
 * こちらが git に push すれば、最大1時間で反映される。
 * 今すぐ反映したいときは、スプレッドシートのメニュー「ロカサポ」→「今すぐ同期」。
 *
 * 【貼り直しが必要なとき】
 * このファイルは原本のコピーで、Google 側のスクリプトは自動では更新されない。
 * スクリプト自体を書き換えたときだけ、手順2をやり直して貼り直すこと。
 * CSV の列が増減しただけなら貼り直しは不要（列数はヘッダー行から読む）。
 *
 * 【同期できているかの確認】
 * _sync_log タブの最終行を見る。失敗していれば理由がそこに書かれている。
 */

var REPO = 'kkeisuke0407-crypto/local-support.jp';
var BRANCH = 'main';

// 列数は CSV のヘッダー行から読むので、ここに書かない。
// 列を足しても引いてもスクリプトの貼り直しは不要。
var TARGETS = [
  { sheet: 'サマリ', path: 'docs/sheet-tab0-summary.csv', minCols: 5 },
  { sheet: '依頼者', path: 'docs/sheet-tab1-cases.csv', minCols: 5 },
  { sheet: '業者',   path: 'docs/sheet-tab2-quotes.csv', minCols: 5 }
];

/** 手動同期用のメニューを追加する */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('ロカサポ')
    .addItem('今すぐ同期', 'syncAll')
    .addToUi();
}

function syncAll() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var results = [];

  TARGETS.forEach(function (t) {
    try {
      var rows = fetchCsv(t.path);

      // 列数の検算。壊れた CSV でタブを潰さないための安全弁。
      // 正解の列数はヘッダー行そのもの。全行がそれに揃っているかだけを見る
      if (!rows.length) throw new Error('CSV が空です');
      var cols = rows[0].length;
      if (cols < (t.minCols || 2)) {
        throw new Error('列が少なすぎます（' + cols + '列）。CSV が壊れている可能性があります');
      }
      var bad = rows.filter(function (r) { return r.length !== cols; }).length;
      if (bad) throw new Error(bad + ' 行の列数がヘッダー（' + cols + '列）と揃っていません');

      writeSheet(ss, t.sheet, rows);
      results.push(t.sheet + ': ' + (rows.length - 1) + '行 ' + cols + '列 OK');
    } catch (e) {
      results.push(t.sheet + ': 失敗 — ' + e.message);
    }
  });

  // 実行ログを最終行に残す（同期できているか一目で分かるように）
  var log = ss.getSheetByName('_sync_log') || ss.insertSheet('_sync_log');
  log.appendRow([new Date(), results.join(' / ')]);

  return results.join('\n');
}

function fetchCsv(path) {
  // CDN キャッシュを避けるためクエリを付ける
  var url = 'https://raw.githubusercontent.com/' + REPO + '/' + BRANCH + '/' + path
          + '?t=' + Date.now();
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) {
    throw new Error('取得に失敗しました（HTTP ' + res.getResponseCode() + '）');
  }
  return Utilities.parseCsv(res.getContentText());
}

function writeSheet(ss, name, rows) {
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);

  // 行が減ったときに古い行が残らないよう、書き込み前に全消去する
  sh.clearContents();

  // 日付が 46192 のようなシリアル値へ化けるのを防ぐため、
  // 先に範囲全体を書式なしテキストにしてから流し込む
  var range = sh.getRange(1, 1, rows.length, rows[0].length);
  range.setNumberFormat('@');
  range.setValues(rows);

  // ヘッダー行を固定しておくと見やすい
  sh.setFrozenRows(1);
}
