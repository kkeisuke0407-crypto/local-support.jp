$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$quotes = Import-Csv (Join-Path $root 'docs\sheet-tab2-quotes.csv')
$cases = Import-Csv (Join-Path $root 'docs\sheet-tab1-cases.csv')
$serviceByCase = @{}
foreach ($case in $cases) { $serviceByCase[$case.'案件ID'] = $case.'サービス' }

$existing = @{}
foreach ($quote in $quotes) {
    $service = $serviceByCase[$quote.'案件ID']
    if (-not $service) { continue }
    $key = "$service|$($quote.'業者名')"
    if (-not $existing.ContainsKey($key)) { $existing[$key] = $quote }
}

$pool = [System.Collections.Generic.List[object]]::new()
function Add-Vendor {
    param(
        [string]$Service, [string]$Area, [string]$Company, [string]$Priority,
        [string]$Fit, [string]$Url = '', [string]$Email = '', [string]$Phone = '',
        [string]$Method = '公式フォーム', [string]$Source = '公式サイト・公的登録名簿'
    )
    $existingKey = "$Service|$Company"
    $quote = $existing[$existingKey]
    $emailFromHistory = ''
    if ($quote -and $quote.'備考' -match '[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}') { $emailFromHistory = $Matches[0] }
    if (-not $Email) { $Email = $emailFromHistory }
    $status = if ($quote) { "既存打診履歴あり：$($quote.'見積ステータス')" } else { '未打診' }
    $route = if ($Email) { 'メール' } elseif ($Phone) { '電話（メール/フォーム案内を取得）' } else { $Method }
    $ready = if ($Email -or $Phone -or $Url) { '可' } else { '要確認' }
    $pool.Add([pscustomobject]@{
        サービス = $Service
        想定エリア = $Area
        法人名 = $Company
        優先度 = $Priority
        適合根拠 = $Fit
        公式URL = $Url
        窓口メール = $Email
        電話番号 = $Phone
        打診方法 = $route
        即時打診可否 = $ready
        既存打診状況 = $status
        送信前確認 = '紹介可否・案件対応可否のみを確認。依頼者情報は紹介承諾後に共有。'
        根拠 = $Source
    })
}

# 害虫駆除（PCO）: 飲食店・HACCP・定期防除に適合する法人のみ。
$pco = @(
    @('株式会社GateHorse','S','飲食店特化・HACCP記録・24時間対応','https://gatehorse.com/pest-control','gatehorse0302@icloud.com',''),
    @('太洋化工株式会社','S','大阪の法人施設向けIPM・年間管理','https://www.taiyo-kako.co.jp/contents/category/service/','',''),
    @('有限会社大洋防疫研究所','S','大阪府登録・飲食店向け定期防除','https://taiyouboueki.co.jp/','info@taiyouboueki.co.jp',''),
    @('合資会社ユニバース','A','店舗・施設の定期予防メンテナンス','https://gaicyukuzyo-universe.com/','info@gaicyukuzyo-universe.com',''),
    @('株式会社テイクオフ','S','HACCPコーディネーターによる厨房衛生','https://www.takeoff9922.com/products/food-hygiene/','info@takeoff9922.com',''),
    @('株式会社ソニックシステム','S','大阪の飲食店・HACCP対応年間管理','https://sonic-system.com/','info@sonic-system.jp','06-6476-3805'),
    @('株式会社ダストン','S','大阪の飲食店専門・定期防除','https://www.duston.jp/business/','','06-6766-1233'),
    @('株式会社コンフォートライフ','S','大阪市・閉店後の定期防除','https://comfortlife.biz/hygiene.html','','06-6572-5566'),
    @('丸栄産業株式会社','S','飲食店・食品衛生・HACCP管理','https://maruei1961.com/content2.html','',''),
    @('株式会社リメイク','S','大阪市中心部の飲食店定期衛生管理','https://www.remake1121.co.jp/hygiene/','',''),
    @('株式会社アウルズ・ウインク','S','大阪市内・厨房衛生管理・防除業登録','https://duskin-nipponbashi.com/','','06-6647-6400'),
    @('株式会社ジーピーコーポレーション','A','大阪営業所・HACCP対応','https://gpcorp.jp/','',''),
    @('株式会社クレイブ','A','大阪の法人向け害虫防除','https://crave.bz/','info@crave.bz',''),
    @('株式会社ティーソリューション','A','大阪の法人向け衛生管理','https://t-solution-inc.com/','info@t-solution-inc.com',''),
    @('クリーンボーイ大阪株式会社','A','大阪の施設衛生・害虫防除','https://clean-boy.com/','info@clean-boy.com',''),
    @('サクセス株式会社','A','大阪の店舗・施設向け防除','https://success-dk.com/','success-dk@yahoo.co.jp',''),
    @('株式会社ベクトル','A','飲食店向け法人サービス・24時間対応','https://osaka-vektor.com/corporate','',''),
    @('株式会社トラスト','A','大阪市内の飲食店厨房防除','https://www.trust-pest.com/','',''),
    @('株式会社ホームセイバー','A','法人・飲食店の害虫防除','https://homesaver.jp/','',''),
    @('株式会社トリニティエンジニアリング','A','レストラン・厨房の定期防除','https://trinity-eng.co.jp/','',''),
    @('株式会社スマートサプライ','A','飲食店向けHACCP衛生管理','https://smart-supply.co.jp/','',''),
    @('株式会社関西シー・アイ・シー','A','大阪府登録のねずみ昆虫等防除業','https://www.kansai-cic.co.jp/','',''),
    @('株式会社ビー・アライブ','A','大阪府登録のねずみ昆虫等防除業','https://be-alive.co.jp/','',''),
    @('毎美エンジニアリング株式会社','A','大阪府登録のねずみ昆虫等防除業','https://www.mainichi-eng.co.jp/','',''),
    @('株式会社ワールド環境','A','大阪府登録のねずみ昆虫等防除業','https://world-kankyo.co.jp/','',''),
    @('アトラスサービス株式会社','A','大阪府登録のねずみ昆虫等防除業','https://atlas-service.co.jp/','',''),
    @('株式会社ホープ','A','大阪府登録のねずみ昆虫等防除業','https://hope-pco.co.jp/','',''),
    @('株式会社むつみ商会','A','大阪府登録・見積対応','https://mutsumisyokai.com/','support@mutsumisyokai.com',''),
    @('イカリ消毒株式会社','A','食品工場・飲食店の総合的有害生物管理','https://www.ikari.jp/','',''),
    @('アース環境サービス株式会社','A','食品関連施設の衛生管理・防虫防そ','https://www.earth-kankyo.co.jp/','',''),
    @('シェル商事株式会社','A','食品衛生・害虫防除の法人対応','https://www.shell-syoji.co.jp/','',''),
    @('株式会社ダイキチ','A','HACCP監査・害虫駆除を含む衛生管理','https://daikichi.inc/haccp/','',''),
    @('株式会社アペックス西日本','A','大阪拠点の衛生害虫対策','https://www.apex-sangyo.jp/','',''),
    @('アスカ美装株式会社','B','近畿の建築物ねずみ昆虫等防除業','https://www.asukabiso.co.jp/','',''),
    @('中部リースキン株式会社','B','業務用害虫駆除機の定期管理','https://chubu-leasekin.co.jp/','',''),
    @('株式会社STM','B','大阪の飲食店向け業務用害虫管理','https://stm-corp.jp/with/','',''),
    @('株式会社タムラテコ','B','飲食店の衛生管理設備・HACCP関連','https://www.teco.co.jp/','',''),
    @('株式会社日本保健衛生協会','B','大阪府登録のねずみ昆虫等防除業','https://www.nhk-eisei.co.jp/','',''),
    @('株式会社サニックス','B','法人施設の害虫・害獣対策','https://sanix.jp/','',''),
    @('株式会社新栄アリックス','B','業務用の害虫・衛生管理','https://www.shinei-alix.co.jp/','',''),
    @('防除サポート株式会社','B','業務用害虫防除','https://bojo-support.co.jp/','',''),
    @('株式会社いきもの研究社','B','法人施設向け害虫防除','https://ikimono-lab.co.jp/','',''),
    @('株式会社福岡EH','B','食品・施設向け害虫対策','https://fukuoka-eh.jp/','',''),
    @('環境衛生薬品株式会社','B','業務用害虫防除','https://kankyo-eisei.co.jp/','',''),
    @('株式会社日本エージェント','B','法人施設の防虫防そ','https://nihon-agent.co.jp/','',''),
    @('日本防疫株式会社','B','食品・物流施設向けPCO','https://www.nihonboueki.co.jp/','',''),
    @('東化研株式会社','B','衛生害虫防除・施設管理','https://tokaken.co.jp/','',''),
    @('株式会社トータルクリーン','B','定期防除・アフター対応','https://totalclean.co.jp/','',''),
    @('株式会社DAIJU','B','飲食店向け害虫駆除・防除業登録','https://www.life-remodel.com/company.html','',''),
    @('株式会社ダスキン','B','ターミニックス法人向け衛生管理','https://www.duskin.jp/','','')
)
foreach ($v in $pco) { Add-Vendor -Service '害虫駆除(PCO)' -Area '大阪市西区・福岡県（過去案件）' -Company $v[0] -Priority $v[1] -Fit $v[2] -Url $v[3] -Email $v[4] -Phone $v[5] }

# 受水槽清掃: 神奈川県の登録名簿掲載法人（電話で即打診可能）を中心に選定。
$wtk = @(
    @('有限会社正水社','S','横浜市登録・受水槽/高置水槽/ポンプ対応','https://sss.hariko.com/','ezb@s6.dion.ne.jp','045-542-2404'),
    @('横浜ワコー株式会社','S','横浜・受水槽/高置水槽/ポンプ修繕','https://yokohamawako.co.jp/','info@yokohamawako.co.jp',''),
    @('株式会社新設','S','横浜市・高置水槽・給水ポンプ取替','https://www.sinsetu.jp/','',''),
    @('株式会社神栄興業','S','横浜・貯水槽/給排水設備改修','https://www.water-shinei.com/about_us.html','',''),
    @('有限会社ジャパンクリーンサービス','A','横浜市・貯水槽清掃専門','https://www.japancleanservice.com/service.html','',''),
    @('株式会社ダイイチ美装社','A','神奈川県貯水槽清掃業登録','https://daiichi-bisosha.co.jp/','',''),
    @('アドバンスサービス株式会社','A','横浜市全域・高置水槽・修繕対応','https://www.advance1997.co.jp/','',''),
    @('横浜管財株式会社','A','給排水設備・ポンプ配管対応','https://hamakan.jp/','','045-710-5710'),
    @('横浜ビルシステム株式会社','A','ホテル等の施設管理実績','https://www.y-bs.co.jp/','',''),
    @('株式会社アクアサービス','A','貯水槽清掃・水質検査','https://aquaservice.jp/','',''),
    @('株式会社アルス','A','横浜・貯水槽清掃/保守点検','https://arskk.com/','',''),
    @('株式会社アクア技研','A','貯水槽清掃','https://aqua-tr.jp/','',''),
    @('TKKエンジニアリング株式会社','A','給排水工事・清掃','https://tkk-eng.co.jp/','',''),
    @('株式会社ユアーズ','A','水質検査・貯水槽管理','https://yours-aqua.com/','',''),
    @('あしがら環境保全株式会社','B','神奈川県貯水槽清掃業登録','', '', '0465-74-0056'),
    @('株式会社美装フジモト','B','神奈川県貯水槽清掃業登録','', '', '0465-36-2684'),
    @('株式会社湘南サービスセンター','B','神奈川県貯水槽清掃業登録','', '', '0465-24-9171'),
    @('マルコービルワーク株式会社','B','神奈川県貯水槽清掃業登録','', '', '0466-25-7618'),
    @('株式会社サンエーサンクス','B','神奈川県貯水槽清掃業登録','', '', '0467-75-2111'),
    @('有限会社豊商事','B','神奈川県貯水槽清掃業登録','', '', '046-248-1653'),
    @('株式会社オービーエム管財','B','神奈川県貯水槽清掃業登録','', '', '0465-23-4038'),
    @('株式会社北青サービス','B','神奈川県貯水槽清掃業登録','', '', '0463-32-8491'),
    @('株式会社伊藤工務店','B','神奈川県貯水槽清掃業登録','', '', '0465-63-1757'),
    @('有限会社神奈川クリーナー','B','神奈川県貯水槽清掃業登録','', '', '0463-50-1777'),
    @('株式会社出雲水理管理センター','B','神奈川県貯水槽清掃業登録','', '', '0467-85-9141'),
    @('株式会社サンエーヒラツカ','B','神奈川県貯水槽清掃業登録','', '', '0463-55-9666'),
    @('株式会社設備研究センター','B','神奈川県貯水槽清掃業登録','', '', '0463-83-1521'),
    @('株式会社新日本工業','B','神奈川県貯水槽清掃業登録','', '', '046-241-1128'),
    @('株式会社金沢商会','B','神奈川県貯水槽清掃業登録','', '', '0467-22-1070'),
    @('株式会社神中運輸','B','神奈川県貯水槽清掃業登録','', '', '0467-22-2205'),
    @('株式会社東海ビルメンテナス','B','神奈川県貯水槽清掃業登録','', '', '0465-23-4116'),
    @('有限会社島崎設備工業','B','神奈川県貯水槽清掃業登録','', '', '046-888-0441'),
    @('丸和産業株式会社','B','神奈川県貯水槽清掃業登録','', '', '046-865-3780'),
    @('株式会社丹野設備工業所','B','神奈川県貯水槽清掃業登録','', '', '0463-93-0662'),
    @('株式会社不二テクノ','B','神奈川県貯水槽清掃業登録','', '', '046-820-2400'),
    @('株式会社湘南美装','B','神奈川県貯水槽清掃業登録','', '', '0463-22-1494'),
    @('高橋産業株式会社','B','神奈川県貯水槽清掃業登録','', '', '0463-23-3691'),
    @('株式会社浄化槽管理センター','B','神奈川県貯水槽清掃業登録','', '', '0463-32-8853'),
    @('扶桑工業株式会社','B','神奈川県貯水槽清掃業登録','', '', '0463-32-3200'),
    @('株式会社東幸','B','神奈川県貯水槽清掃業登録','', '', '0466-23-0325'),
    @('株式会社アサヒエンジニアリング','B','神奈川県貯水槽清掃業登録','', '', '0463-58-8989'),
    @('株式会社ニッテク','B','神奈川県貯水槽清掃業登録','', '', '0465-36-1761'),
    @('有限会社加藤設備','B','神奈川県貯水槽清掃業登録','', '', '0465-37-2361'),
    @('フロンティア１株式会社','B','神奈川県貯水槽清掃業登録','', '', '0465-35-2038'),
    @('相和設備工業株式会社','B','神奈川県貯水槽清掃業登録','', '', '0466-25-2252'),
    @('株式会社朝日美装','B','神奈川県貯水槽清掃業登録','', '', '046-222-2555'),
    @('株式会社郵生','B','神奈川県貯水槽清掃業登録','', '', '0463-33-3108'),
    @('株式会社ソウマ','B','神奈川県貯水槽清掃業登録','', '', '0467-54-6414'),
    @('株式会社ライフライン岩崎','B','神奈川県貯水槽清掃業登録','', '', '046-823-0943'),
    @('株式会社湘南汚水研究所','B','神奈川県貯水槽清掃業登録','', '', '0467-86-3581')
)
foreach ($v in $wtk) { Add-Vendor -Service '受水槽清掃' -Area '神奈川県横浜市西区（過去案件）' -Company $v[0] -Priority $v[1] -Fit $v[2] -Url $v[3] -Email $v[4] -Phone $v[5] -Source '神奈川県 建築物飲料水貯水槽清掃業登録名簿・公式サイト' }

# 太陽光パネル清掃: 低圧83kW規模の清掃・除草を優先。
$solarNames = @(
    '竹内産業株式会社','株式会社ライン','株式会社ライフメンテナンス','株式会社トータルメンテナンス','パワーエンジニアリング株式会社','丸瀬産業株式会社','横田美装株式会社',
    '株式会社F.C.S','株式会社エス・ワイプランニング','株式会社エネルフト','株式会社イトデンエンジニアリング','株式会社LC-JAPAN','ニシリク株式会社','株式会社パワーガード','株式会社みつば電気','株式会社りょうしんメンテナンスサービス','ソーラーフロンティア株式会社','日本コンベヤ株式会社','株式会社PV Japan','株式会社NEOSTAR','株式会社イーロックホーム','南開工業株式会社','株式会社日建','京セラコミュニケーションシステム株式会社','株式会社エスコ','GC POWER株式会社','株式会社Landclean','株式会社RISEUP','株式会社VICTORY','株式会社GreenWork','株式会社エネファス','株式会社ミライト・テクノロジーズ','テクノケア株式会社','オリックス・リニューアブルエナジー・マネジメント株式会社','SUNTECH POWER JAPAN株式会社','株式会社ソーラーオム','竹内マネージメント株式会社','合同会社sumrise','株式会社ＳＡＮコンサルティング','BLUERAY株式会社','相和電気工業株式会社','GCPホールディングス株式会社','綜合サービス株式会社','株式会社グリーンエナジー・ファシリティーズ','ダイナミックソーラ株式会社','関西電機工業株式会社','株式会社ソーラーケア','株式会社エネテク','株式会社novis','株式会社グッドフェローズ'
)
$solarUrls = @{
 '株式会社ライン'='https://line55.jp/kankyo/weeding/'; '丸瀬産業株式会社'='https://maruse-i.com/service/'; '株式会社日建'='https://www.nik-ken.jp/product/om'; '株式会社エスコ'='https://www.esco-co.jp/service/solarsystem/maintenance/'; '日本コンベヤ株式会社'='https://www.conveyor.co.jp/business/solar.html'; '竹内マネージメント株式会社'='https://www.takeuchi-grp.co.jp/solar_om/low.html'; '合同会社sumrise'='https://sumrise-llc.co.jp/'; '株式会社ＳＡＮコンサルティング'='https://sansolar.wixsite.com/oandm'; 'BLUERAY株式会社'='https://blueray.co.jp/nightsafe'; '相和電気工業株式会社'='https://aiwa-denki.co.jp/solar-maintenance/'; 'GCPホールディングス株式会社'='https://www.gcp-hd.co.jp/maintenanceservices/'; '株式会社グリーンエナジー・ファシリティーズ'='https://green-energy.co.jp/'; 'ダイナミックソーラ株式会社'='https://dynamic-solar.co.jp/'
}
foreach ($name in $solarNames) {
    $priority = if ($name -in @('竹内産業株式会社','株式会社ライン','丸瀬産業株式会社','株式会社F.C.S','株式会社エス・ワイプランニング','株式会社イトデンエンジニアリング','株式会社みつば電気','竹内マネージメント株式会社','相和電気工業株式会社')) { 'S' } else { 'A' }
    $url = if ($solarUrls.ContainsKey($name)) { $solarUrls[$name] } else { '' }
    $email = if ($name -eq '竹内マネージメント株式会社') { 'solar-maintenance-hyogo@takeuchi-grp.co.jp' } elseif ($name -eq 'テクノケア株式会社') { 'info@techno-care.jp' } else { '' }
    Add-Vendor -Service '太陽光パネル清掃' -Area '兵庫県佐用町（過去案件）' -Company $name -Priority $priority -Fit '太陽光発電所のO&M、パネル洗浄または除草・敷地管理に対応' -Url $url -Email $email -Source '公式サービスページ・過去打診履歴'
}

# キュービクル: 電気保安法人/高圧受変電保安管理の法人を優先。
$denNames = @(
    '株式会社青木電気設計事務所','株式会社TKテクノサービス','NDK総合サービス株式会社','株式会社東京電気検査協会','太平ビルサービス株式会社','株式会社エネサーブ神奈川','株式会社関東電気サービス','株式会社エレックス極東','株式会社八興','武蔵野電気管理株式会社','株式会社関東エフシーリーズ','株式会社ビルセット','株式会社千葉県電気保守協会','有限会社ケーワイエンジニア','有限会社エスティエス','株式会社エス・イー・ティ','株式会社メジャーシステム','テクノ・デコール株式会社','東洋ビルメンテナンス株式会社','有限会社中村電気管理事務所','株式会社オルテ','全電協株式会社','株式会社エスコ','日本テクノ株式会社','日本電機産業株式会社','株式会社キューピクル','株式会社広宣社','株式会社関東電気自主検査協会','有限会社久川電気管理事務所','有限会社山下電気設計事務所','株式会社ハマ・メンテ','株式会社アーステラ','亨和テクニカル株式会社','ライフレック株式会社','株式会社でんきかんりみらい','エクスゲート株式会社','レジル電気保安株式会社','株式会社東京電気保安協会','株式会社東京電気保安管理','株式会社東日本電気保安サービス','株式会社日本電気保安協会','株式会社関東保安サービス','株式会社電気保安管理センター','株式会社電気保安協会','株式会社高圧保安サービス','株式会社ユニバーサル電気保安','株式会社電力保安協会','株式会社電気設備保全センター','株式会社エネルギー保安センター','株式会社東関東電気保安'
)
$denUrls = @{
 '株式会社オルテ'='https://www.orte.co.jp/cubicle'; '全電協株式会社'='https://www.zendenkyo.co.jp/'; '株式会社エスコ'='https://www.esco-co.jp/service/cubicle/'; '日本テクノ株式会社'='https://www.cubicle-hoan.jp/'; '株式会社キューピクル'='https://cupicle.co.jp/company/'; '株式会社広宣社'='https://www.kosen-net.co.jp/service/emss/'; '武蔵野電気管理株式会社'='https://e-musashino.com/'
}
foreach ($name in $denNames) {
    $priority = if ($name -in @('株式会社青木電気設計事務所','株式会社TKテクノサービス','NDK総合サービス株式会社','株式会社東京電気検査協会','太平ビルサービス株式会社','株式会社エネサーブ神奈川','株式会社オルテ','全電協株式会社','日本テクノ株式会社','株式会社キューピクル','武蔵野電気管理株式会社')) { 'S' } else { 'A' }
    $url = if ($denUrls.ContainsKey($name)) { $denUrls[$name] } else { '' }
    Add-Vendor -Service '自家用電気工作物点検(キュービクル)' -Area '東京都江戸川区（過去案件）' -Company $name -Priority $priority -Fit '高圧受変電設備の月次・年次点検、保安管理業務外部委託に対応' -Url $url -Source '関東東北産業保安監督部 電気保安法人一覧・公式サイト'
}

# フロン定期点検: 愛知近隣の第一種フロン類充填回収・定期点検対応法人。
$frnNames = @(
    '株式会社新空調','株式会社浜設','株式会社タカゼン','東3冷凍機株式会社','株式会社ミナミテクノ','株式会社トップエアサービス','日本ビルコン株式会社','三菱重工サーマルシステムズ株式会社','株式会社エコ・プラン','株式会社エコネスト','ワシズ機械株式会社','ワンオール株式会社','中日株式会社','有限会社リョウテック','株式会社アカツキ電装','株式会社星空調機器','三晃プラント株式会社','株式会社立松空調サービス','株式会社エアーフ','株式会社アール・エス・シー中部','株式会社L&E','株式会社エヌケーサービス','株式会社T-JACK','株式会社空調舎','シンク空調サービス株式会社','株式会社ナガタクウセツ','J-TEC株式会社','有限会社イマイ','大冷工業株式会社','株式会社尾張空調','エヌケーエス設備株式会社','有限会社愛知ビル管理','メイセイ株式会社','株式会社東海エアーシステム','株式会社オオマキ','株式会社本陣冷機工業','株式会社レボテクノ','ホシザキ東海株式会社','ミカタ株式会社','株式会社エミテック','株式会社東和総合サービス','株式会社ダイキンHVACソリューション東海','パナソニック産機システムズ株式会社','三菱電機ビルソリューションズ株式会社','東芝キヤリア空調サービス株式会社','日立グローバルライフソリューションズ株式会社','株式会社日立ビルシステム','株式会社朝日機器エンジニアリング','株式会社日本空調サービス','株式会社太平エンジニアリング'
)
$frnUrls = @{
 '株式会社エコネスト'='https://www.econest.co.jp/'; 'ワシズ機械株式会社'='https://www.e-washizu.co.jp/'; '有限会社リョウテック'='https://www.ryoutech.com/service/inspection.html'; '株式会社ミナミテクノ'='https://e-mtec.co.jp/business-repair'; 'メイセイ株式会社'='https://meisei-s.co.jp/business_01.html'; '株式会社東海エアーシステム'='https://www.tokaiairsystem.com/'; '株式会社オオマキ'='https://www.omaki.jp/'; '株式会社本陣冷機工業'='https://honjinreiki171.com/information'; '株式会社レボテクノ'='https://revo-techno.com/'; 'ホシザキ東海株式会社'='https://hoshizaki-tokai.co.jp/maintenance'; 'ミカタ株式会社'='https://aircon-sc-tokai.com/company/'; '株式会社エミテック'='https://www.emitec-official.com/'; '株式会社東和総合サービス'='https://www.to-wa.info/service/aircon/inspection/'
}
foreach ($name in $frnNames) {
    $priority = if ($name -in @('株式会社新空調','株式会社浜設','株式会社タカゼン','東3冷凍機株式会社','株式会社エコネスト','ワシズ機械株式会社','中日株式会社','有限会社リョウテック','株式会社アカツキ電装','株式会社トップエアサービス','株式会社東海エアーシステム')) { 'S' } else { 'A' }
    $url = if ($frnUrls.ContainsKey($name)) { $frnUrls[$name] } else { '' }
    Add-Vendor -Service 'フロン排出抑制法定期点検' -Area '愛知県北名古屋市（過去案件）' -Company $name -Priority $priority -Fit '業務用空調・冷凍冷蔵設備の簡易/定期点検、記録作成または第一種フロン類充填回収に対応' -Url $url -Source '愛知県第一種フロン類充填回収業者名簿・公式サービスページ'
}

# 看板・屋外広告物点検: 埼玉/川口の登録・有資格者・点検報告書対応を優先。
$signNames = @(
    'サインエフェクト株式会社','デザインスタジオ エクセル株式会社','CUVIC株式会社','株式会社万兵衛','株式会社匠栄房','株式会社ラフ','株式会社富士アド','株式会社美園工芸社','株式会社エーアイ・プラス','アイショット株式会社','株式会社ジー・スタッフ','株式会社たつみ','有限会社三宝メンテナンス','ひばり広告株式会社','株式会社日の出広美社','株式会社ウイット・タカダ','グローアップ株式会社','三幸商洋株式会社','株式会社フィールド','株式会社関東ダイイチ','RASTA東京株式会社','有限会社山本美創','DECOSIGN東美株式会社','ワイズ株式会社','株式会社オーエスアート','株式会社エイシンプランニング','株式会社看板ボーイ','株式会社晃新製作所','株式会社近丸','株式会社アド・アサヒ','株式会社アド・サイン','株式会社アート・ワーク','株式会社アート・プランニング','株式会社アートフリーク','株式会社アドシステム','株式会社サイン・アーテック','株式会社サイン・スペース','株式会社サインズ','株式会社サンコー企画','株式会社シーエス・ワン','株式会社スカイサイン','株式会社スペースアート','株式会社ゼンシン','株式会社タカハシ工芸','株式会社ダイカン','株式会社テクノサイン','株式会社トーガシ','株式会社ナカムラ看板','株式会社ニッシン','株式会社ハヤシ工芸'
)
$signUrls = @{
 '株式会社万兵衛'='https://chikamaru.com/inspection/'; 'RASTA東京株式会社'='https://www.rasta-japan.com/company/'; '有限会社山本美創'='https://y-kanban.jp/company/'; '株式会社エーアイ・プラス'='https://ai-group.jp/'; 'アイショット株式会社'='https://www.eyeshot.co.jp/'; 'DECOSIGN東美株式会社'='https://decosign-tohbi.co.jp/company'; 'ワイズ株式会社'='https://ys-sign.co.jp/info01.html'; '株式会社オーエスアート'='https://www.os-art.co.jp/about/'; '株式会社エイシンプランニング'='https://eishinplanning-inc.co.jp/company'
}
foreach ($name in $signNames) {
    $priority = if ($name -in @('サインエフェクト株式会社','デザインスタジオ エクセル株式会社','CUVIC株式会社','株式会社万兵衛','株式会社匠栄房','株式会社ラフ','株式会社富士アド','RASTA東京株式会社','有限会社山本美創','アイショット株式会社','グローアップ株式会社')) { 'S' } else { 'A' }
    $url = if ($signUrls.ContainsKey($name)) { $signUrls[$name] } else { '' }
    $email = if ($name -eq 'RASTA東京株式会社') { 'tokyo@rasta-japan.com' } elseif ($name -eq '有限会社山本美創') { 'y-bisou@circus.ocn.ne.jp' } elseif ($name -eq 'ひばり広告株式会社') { 'hibari_sign@ktb.biglobe.ne.jp' } elseif ($name -eq '三幸商洋株式会社') { 'sankoh_sy@yahoo.co.jp' } else { '' }
    Add-Vendor -Service '看板・屋外広告物点検' -Area '埼玉県川口市（過去案件）' -Company $name -Priority $priority -Fit '屋外広告業登録または特例届出、有資格者による点検・報告書作成の候補' -Url $url -Email $email -Source '埼玉県屋外広告業登録簿・公式サービスページ'
}

$serviceCounts = $pool | Group-Object サービス
foreach ($group in $serviceCounts) {
    if ($group.Count -ne 50) { throw "$($group.Name) の候補数が $($group.Count) 件です。50件に調整してください。" }
}

$pool | Export-Csv (Join-Path $root 'docs\sheet-tab3-vendor-pool.csv') -NoTypeInformation -Encoding utf8BOM
