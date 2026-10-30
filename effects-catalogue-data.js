/* Catalogue metadata is intentionally independent from the demo renderers. */
window.EFFECT_CATEGORIES = [
 ['ENTRANCE & EXIT EFFECTS','出現・消失の演出',[
 ['FADE IN','透明な状態から現れます。要素の自然な登場に。'],['FADE OUT','徐々に透明になります。通知や画面の退場に。'],['FADE IN / OUT','出現と消失を繰り返し、状態の変化を伝えます。'],['SLIDE IN','画面外から滑り込みます。パネルの登場に。'],['SLIDE OUT','横へ滑りながら退場します。メニューを閉じる場面に。'],['ZOOM IN','小さい状態から拡大して現れます。注目させたい要素に。'],['ZOOM OUT','大きい状態から縮小して現れます。奥行きのある導入に。'],['SCALE TRANSFORM','大きさを変化させます。選択や強調のフィードバックに。'],['ROTATE IN','回転しながら現れます。アイコンの登場に。'],['FLIP IN','裏返るように現れます。カードの登場に。'],['BOUNCE','重力を感じさせる跳ね返り。通知や強調に。'],['ELASTIC','ばねのように伸縮します。遊び心のある操作応答に。'],['BLUR IN','ぼけた状態から鮮明になります。静かな導入に。'],['CLIP-PATH REVEAL','切り抜き領域を広げて表示します。画像や見出しの登場に。'],['WIPE TRANSITION','覆いが流れて次の内容を見せます。場面転換に。']]],
 ['SCROLL EFFECTS','スクロール連動の演出',[
 ['SCROLL REVEAL','表示領域に入った要素を出現させます。記事や作品一覧に。'],['SCROLL-TRIGGERED ANIMATION','指定位置を通過すると一度アニメーションします。節目の演出に。'],['SCROLL-LINKED ANIMATION','スクロール量と動きの進行を直接結び付けます。'],['PARALLAX SCROLLING','背景と前景を異なる速度で動かし、奥行きを作ります。'],['STICKY SCROLLING','見出しを一定位置に留めます。長い説明の案内に。'],['PINNED SECTION','区間中は要素を固定し、周囲の内容を進めます。'],['HORIZONTAL SCROLL','縦スクロールを横方向の移動に変換します。作品紹介に。'],['SCROLL PROGRESS BAR','読了までの進み具合をバーで表示します。'],['ZOOM ON SCROLL','スクロールに合わせて画像を拡大します。'],['IMAGE REVEAL ON SCROLL','スクロール量に合わせ画像のマスクを開きます。'],['TEXT REVEAL ON SCROLL','スクロールに合わせ文字を順番に表示します。']]],
 ['PAGE & VIEW TRANSITIONS','画面切り替えの演出',[
 ['VIEW TRANSITIONS','ブラウザに変更前後の画面をつないでもらいます。'],['CROSSFADE','前後の画面の透明度を交差させて切り替えます。'],['MORPH TRANSITION','形やサイズを変えながら次の画面へつなぎます。'],['SHARED ELEMENT TRANSITION','共通する要素が次の位置へ移ることで連続性を伝えます。'],['PAGE WIPE','新しい画面で古い画面を拭うように置き換えます。'],['CURTAIN TRANSITION','幕が開くように新しい画面を見せます。'],['CUBE TRANSITION','立方体の面を回すように表示を切り替えます。'],['ROUTE TRANSITION','移動先の表示を退場・登場の順でつなぎます。']]],
 ['HOVER & INTERACTIVE EFFECTS','マウス・タッチ操作の演出',[
 ['HOVER EFFECT','ポインターを重ねると色が変わります。操作可能な要素の案内に。'],['HOVER LIFT','カードが浮き上がります。選択できる項目の強調に。'],['HOVER GLOW','光が広がります。注目するボタンの強調に。'],['HOVER SCALE','要素を拡大します。操作の手応えに。'],['IMAGE ZOOM HOVER','枠を保ったまま画像だけを拡大します。作品の一覧に。'],['MAGNETIC BUTTON','ポインターに引き寄せられるボタン。印象的な操作感に。'],['CURSOR FOLLOW','ポインターを追う図形。位置を視覚化します。'],['CUSTOM CURSOR','専用のカーソルを表示します。デモ領域内だけに適用。'],['RIPPLE EFFECT','押した位置から波紋が広がります。タップの応答に。'],['TILT EFFECT','ポインター位置に応じてカードが傾きます。'],['DRAG & DROP','カードを移動し、受け取り枠へ置きます。並び替えや整理に。'],['ACCORDION','必要な説明だけを展開します。FAQなどに。'],['MODAL / LIGHTBOX','背景の上に詳細を表示します。画像の拡大や補足に。'],['TOGGLE SWITCH','オン・オフを切り替えます。設定状態の可視化に。']]],
 ['TYPOGRAPHY EFFECTS','文字の演出',[
 ['TYPEWRITER EFFECT','文字を一文字ずつ表示します。メッセージの導入に。'],['TEXT REVEAL','文字の表示範囲を広げます。見出しの登場に。'],['KINETIC TYPOGRAPHY','文字の位置や向きを動かします。リズムのある見出しに。'],['TEXT GRADIENT','文字の内部にグラデーションを付けます。'],['TEXT GLOW','文字の周りを発光させます。暗い画面の強調に。'],['TEXT STROKE','文字の輪郭線を見せます。大きな装飾見出しに。'],['TEXT SHADOW','文字に影を付け、立体感を与えます。'],['MARQUEE','文字を連続して流します。短いメッセージの反復に。'],['SPLIT TEXT ANIMATION','文字を分割して時間差で動かします。'],['VARIABLE FONT ANIMATION','可変フォントの太さ軸を連続的に変えます。']]],
 ['IMAGE & BACKGROUND EFFECTS','画像・背景の演出',[
 ['IMAGE SLIDER','前後ボタンで画像を一枚ずつ切り替えます。'],['IMAGE CAROUSEL','複数の画像を横並びで回します。ギャラリーに。'],['IMAGE MASKING','画像の表示領域を形で切り抜きます。'],['IMAGE PARALLAX','ポインターに合わせて画像を枠の中でずらします。'],['KEN BURNS EFFECT','静止画像をゆっくり拡大・移動します。'],['DUOTONE EFFECT','画像の明暗を二色で表現します。ビジュアルの統一に。'],['BLUR BACKGROUND','背面をぼかして前面の内容を読みやすくします。'],['GRADIENT ANIMATION','背景色のグラデーションをゆっくり動かします。'],['PARTICLE EFFECT','小さな粒子を動かし、空気感を作ります。'],['SHIMMER EFFECT','光の帯を流します。読み込み中の表現に。'],['NOISE TEXTURE','細かいノイズを重ねて背景に質感を加えます。'],['BLEND MODE','色の重なり方を変えて複合的な色を作ります。']]],
 ['3D & DEPTH EFFECTS','立体・空間の演出',[
 ['3D TRANSFORM','要素を三次元の軸で回転させます。'],['3D CARD FLIP','カードを立体的に裏返して別の情報を見せます。'],['3D CAROUSEL','複数のカードを立体的な円に並べて回します。'],['DEPTH OF FIELD','距離ごとにぼけを変えて被写界深度を表現します。'],['PERSPECTIVE EFFECT','消失点へ向かう変形で遠近感を作ります。'],['PARALLAX LAYERS','複数の層を異なる量で動かして奥行きを作ります。'],['INFINITE ZOOM','入れ子の形を拡大し、奥へ進み続ける印象を作ります。'],['SCENE TRANSITION','奥行きと色を変えて別の場面へ移動します。']]],
 ['UI & MICROINTERACTIONS','インターフェース・操作補助',[
 ['SMOOTH SCROLL','目的地へ滑らかにスクロールします。'],['BACK TO TOP','スクロール領域の先頭へ戻ります。'],['PROGRESS INDICATOR','処理の進行を数値とバーで伝えます。'],['LOADING ANIMATION','処理を待っている状態を回転で知らせます。'],['SKELETON SCREEN','内容が届くまで仮の形を表示します。'],['TOOLTIP','フォーカスやホバーで補足を見せます。'],['STICKY NAVIGATION','スクロール中も案内メニューを上に留めます。'],['HAMBURGER MENU','メニューボタンからリンク一覧を開閉します。'],['NOTIFICATION TOAST','操作後に短い通知を表示します。'],['BUTTON STATE TRANSITION','待機・処理中・完了へボタンの状態を変えます。'],['SCROLL INDICATOR','下に続く内容があることを動きで案内します。'],['LAZY LOADING','表示領域に近づいた画像だけを読み込みます。']]],
 ['ADVANCED EFFECTS','高度・複合的な演出',[
 ['STAGGER ANIMATION','複数の要素を少しずつ時間をずらして動かします。'],['SEQUENCE ANIMATION','要素を決めた順序で動かします。'],['CHOREOGRAPHED ANIMATION','複数の動きを組み合わせ、一つの流れを作ります。'],['MOTION BLUR','移動にぼけや残像を組み合わせて速度を伝えます。'],['LIQUID TRANSITION','液体を思わせる輪郭変化で切り替えます。'],['GLITCH EFFECT','色ずれと位置の乱れでデジタルノイズを表現します。'],['SHATTER EFFECT','一枚の図形を破片へ分割して飛ばします。'],['EXPLOSION TRANSITION','中心から要素が放射状に散ります。'],['MORPHING SHAPES','図形の輪郭を連続的に変えます。'],['INFINITE LOOP ANIMATION','始点と終点をつなぎ、滑らかに動きを繰り返します。'],['WEBGL EFFECTS','GPUのシェーダーで色の波を描画します。'],['CANVAS ANIMATION','Canvasへ毎フレーム図形を描いて動かします。'],['SVG ANIMATION','SVGの線を徐々に描いて図形を出現させます。']]]
];
const effectReadings = [
 'フェードイン|フェードアウト|フェードイン／アウト|スライドイン|スライドアウト|ズームイン|ズームアウト|スケール・トランスフォーム|ローテートイン|フリップイン|バウンス|エラスティック|ブラーイン|クリップパス・リビール|ワイプ・トランジション',
 'スクロール・リビール|スクロール・トリガード・アニメーション|スクロール・リンクド・アニメーション|パララックス・スクローリング|スティッキー・スクローリング|ピンド・セクション|ホリゾンタル・スクロール|スクロール・プログレスバー|ズーム・オン・スクロール|イメージ・リビール・オン・スクロール|テキスト・リビール・オン・スクロール',
 'ビュー・トランジションズ|クロスフェード|モーフ・トランジション|シェアード・エレメント・トランジション|ページ・ワイプ|カーテン・トランジション|キューブ・トランジション|ルート・トランジション',
 'ホバー・エフェクト|ホバー・リフト|ホバー・グロウ|ホバー・スケール|イメージ・ズーム・ホバー|マグネティック・ボタン|カーソル・フォロー|カスタム・カーソル|リップル・エフェクト|ティルト・エフェクト|ドラッグ＆ドロップ|アコーディオン|モーダル／ライトボックス|トグル・スイッチ',
 'タイプライター・エフェクト|テキスト・リビール|キネティック・タイポグラフィ|テキスト・グラデーション|テキスト・グロウ|テキスト・ストローク|テキスト・シャドウ|マーキー|スプリット・テキスト・アニメーション|バリアブル・フォント・アニメーション',
 'イメージ・スライダー|イメージ・カルーセル|イメージ・マスキング|イメージ・パララックス|ケン・バーンズ・エフェクト|デュオトーン・エフェクト|ブラー・バックグラウンド|グラデーション・アニメーション|パーティクル・エフェクト|シマー・エフェクト|ノイズ・テクスチャ|ブレンド・モード',
 'スリーディー・トランスフォーム|スリーディー・カード・フリップ|スリーディー・カルーセル|デプス・オブ・フィールド|パースペクティブ・エフェクト|パララックス・レイヤーズ|インフィニット・ズーム|シーン・トランジション',
 'スムーズ・スクロール|バック・トゥ・トップ|プログレス・インジケーター|ローディング・アニメーション|スケルトン・スクリーン|ツールチップ|スティッキー・ナビゲーション|ハンバーガー・メニュー|ノーティフィケーション・トースト|ボタン・ステート・トランジション|スクロール・インジケーター|レイジー・ローディング',
 'スタガー・アニメーション|シーケンス・アニメーション|コレオグラフド・アニメーション|モーション・ブラー|リキッド・トランジション|グリッチ・エフェクト|シャター・エフェクト|エクスプロージョン・トランジション|モーフィング・シェイプス|インフィニット・ループ・アニメーション|ウェブジーエル・エフェクツ|キャンバス・アニメーション|エスブイジー・アニメーション'
].map(group => group.split('|'));
window.EFFECTS = window.EFFECT_CATEGORIES.flatMap((category,c) => category[2].map(([name,description],i) => ({
 id:`${c+1}-${i+1}`,name,description,reading:effectReadings[c][i],category:c,
 difficulty:c===8||/WEBGL|3D CAROUSEL|SHARED ELEMENT/.test(name)?'ADVANCED':c===1||c===2||/MAGNETIC|DRAG|CURSOR|TILT|PARALLAX|PARTICLE|CANVAS|LAZY/.test(name)?'MEDIUM':'EASY',
 tech:/WEBGL/.test(name)?'WebGL / GLSL / JavaScript':/CANVAS|PARTICLE/.test(name)?'Canvas / JavaScript':/SVG ANIMATION/.test(name)?'SVG / Web Animations API':name==='VIEW TRANSITIONS'?'View Transitions API / CSS':/LAZY|SCROLL REVEAL|SCROLL-TRIGGERED/.test(name)?'IntersectionObserver / JavaScript':c===1?'CSS / JavaScript / Scroll API':'CSS / JavaScript / Web Animations API',
 simplified:['MORPH TRANSITION','SHARED ELEMENT TRANSITION','CUBE TRANSITION','ROUTE TRANSITION','VARIABLE FONT ANIMATION','LIQUID TRANSITION','MOTION BLUR','SCENE TRANSITION'].includes(name)
})));
