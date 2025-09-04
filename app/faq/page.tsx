// pages/faq.tsx
export default function FAQPage() {
  const VERSION = "2025-09-04.1";
  const UPDATED = "2025年9月4日";
  return (
    <main style={{ maxWidth: 800, margin: "auto", padding: "2rem" }}>
      <h1>
        よくある質問（研究利用）{" "}
        <small style={{ fontSize: 14, color: "#666" }}>
          v{VERSION}（最終更新：{UPDATED}）
        </small>
      </h1>

      {/* まず読んでほしいポイント */}
      <section
        style={{
          margin: "1.5rem 0",
          background: "#fff7e6",
          border: "1px solid #ffd28a",
          borderRadius: 8,
          padding: "1rem",
        }}
      >
        <h2 style={{ marginTop: 0 }}>最初に読んでほしいこと</h2>
        <ul>
          <li><strong>共有の範囲は研究参加者（ログインユーザー）間のみ。</strong>一般公開はされません。</li>
          <li>共有は<strong>任意</strong>です。公開したくない場合は「共有から外す」で当ページから非表示にできます。</li>
          <li>児童個人情報や学校の内部情報は投稿しないでください。PDFや画像は<strong>匿名化</strong>（本文・目次・ヘッダー/フッター・ファイル名・プロパティ等）を徹底。</li>
          <li>保存データは、<strong>運営者の管理環境内</strong>で匿名化・統計化のうえ研究・品質改善に利用します。<strong>外部の会社への原データ提供は行いません。</strong></li>
          <li>暗号化バックアップを<strong>最大30日</strong>保持。復旧は<strong>ベストエフォート</strong>（完全復旧は保証されません）。重要な資料はPDF等で<strong>自己バックアップ</strong>してください。</li>
        </ul>
        <p style={{ fontSize: 13, marginTop: 8 }}>
          参考：<a href="/terms">利用規約</a>／<a href="/privacy">プライバシーポリシー</a>
        </p>
      </section>

      {/* Q1 */}
      <section style={{ margin: "2rem 0" }}>
        <h2><strong>Q1:</strong> 誰が閲覧できますか？</h2>
        <p>研究参加者としてログインしているユーザーのみが閲覧できます。一般公開は行いません。</p>
      </section>

      {/* Q2 */}
      <section style={{ margin: "2rem 0" }}>
        <h2><strong>Q2:</strong> 投稿の共有は必須ですか？</h2>
        <p>共有は任意です。投稿後に「共有から外す」で共有ページから非表示にできます。</p>
      </section>

      {/* Q3 */}
      <section style={{ margin: "2rem 0" }}>
        <h2><strong>Q3:</strong> 研究ではどのように使われますか？</h2>
        <p>保存データは運営者の管理環境内で匿名化・統計化され、研究の分析・評価・学術的成果作成や品質改善に利用されます。成果公表は個人・学校・投稿が特定されない統計・傾向・匿名事例の範囲です。</p>
      </section>

      {/* Q4 */}
      <section style={{ margin: "2rem 0" }}>
        <h2><strong>Q4:</strong> 児童の個人情報や学校の内部情報は？</h2>
        <p><strong>投稿しないでください。</strong>やむを得ず写り込む場合は、マスキング・ぼかし・切り抜きで必ず匿名化してください。PDF/画像の本文・目次・ヘッダー/フッター・<strong>ファイル名とプロパティ</strong>も忘れずに匿名化してください。</p>
      </section>

      {/* Q5 */}
      <section style={{ margin: "2rem 0" }}>
        <h2><strong>Q5:</strong> 自分の名前は表示されますか？</h2>
        <p>教員名は匿名運用が可能です。必要に応じて伏字・ニックネームを使用してください。</p>
      </section>

      {/* Q6 */}
      <section style={{ margin: "2rem 0" }}>
        <h2><strong>Q6:</strong> 研究参加をやめたい/同意を撤回したい。</h2>
        <p>アプリ内の「お問い合わせフォーム」から申請してください。今後の研究利用は停止されますが、既公表の成果・既に構築済みモデルから個別影響を完全に除去することは技術的に困難な場合があります。</p>
      </section>

      {/* Q7 */}
      <section style={{ margin: "2rem 0" }}>
        <h2><strong>Q7:</strong> 外部企業へデータは提供されますか？</h2>
        <p>研究・品質改善の処理は運営者の管理環境内で実施します。<strong>外部の会社に原データを渡して学習させることはしません。</strong>クラウド等の委託は守秘義務と安全管理契約の下で行います。</p>
      </section>

      {/* Q8 */}
      <section style={{ margin: "2rem 0" }}>
        <h2><strong>Q8:</strong> バックアップと復旧は？</h2>
        <p>暗号化バックアップを<strong>最大30日</strong>保持します。復旧はベストエフォートで、完全復旧は保証されません。重要な資料はPDF出力や画像保存などで自己バックアップを推奨します。</p>
      </section>

      {/* Q9 */}
      <section style={{ margin: "2rem 0" }}>
        <h2><strong>Q9:</strong> 誰かの投稿を研究成果にそのまま載せますか？</h2>
        <p>特定の個人・学校・投稿が識別される形では公表しません。公表は匿名化された統計・傾向・個別特定不可能な事例に限ります。</p>
      </section>

      {/* Q10 */}
      <section style={{ margin: "2rem 0" }}>
        <h2><strong>Q10:</strong> ブラウザや端末の推奨は？</h2>
        <p>最新の Chrome / Edge / Safari / Firefox を推奨します。動作が不安定な場合はハードリロードや別ブラウザをお試しください。</p>
      </section>

      {/* Q11 */}
      <section style={{ margin: "2rem 0" }}>
        <h2><strong>Q11:</strong> 問い合わせはどこから？</h2>
        <p>アプリ内の「お問い合わせフォーム」からご連絡ください。発生時刻・操作手順・スクリーンショット・ブラウザ/端末情報をご提供いただけると助かります。</p>
      </section>
    </main>
  );
}
