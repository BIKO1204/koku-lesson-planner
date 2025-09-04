// pages/privacy.tsx
export default function PrivacyPage() {
  const VERSION = "2025-09-04.1";
  const EFFECTIVE_DATE = "2025年9月4日";
  return (
    <main style={{ maxWidth: 800, margin: "auto", padding: "2rem" }}>
      <h1>
        プライバシーポリシー（研究参加者向け）{" "}
        <small style={{ fontSize: 14, color: "#666" }}>
          v{VERSION}（施行日：{EFFECTIVE_DATE}）
        </small>
      </h1>

      <section style={{ margin: "2rem 0" }}>
        <h2><strong>第1条（目的・管理者・適用範囲）</strong></h2>
        <p>本ポリシーは、本サービスを研究目的で利用する際の個人情報等の取扱いを定めます。管理者：運営者（連絡先：アプリ内「お問い合わせフォーム」）。</p>
        <p><strong>共有の範囲は研究参加者（ログインユーザー）間に限定</strong>され、<strong>一般公開は行いません</strong>。</p>
      </section>

      <section style={{ margin: "2rem 0" }}>
        <h2><strong>第2条（取得する情報）</strong></h2>
        <ul>
          <li>アカウント情報：氏名（任意化可）・メールアドレス等の認証識別子</li>
          <li>コンテンツ情報：授業案・実践記録・画像・PDF・コメント・公開/共有設定・出典/ライセンス・利用メタデータ</li>
          <li>技術情報：アクセスログ、端末/ブラウザ情報、Cookie等の識別子</li>
          <li>研究関連：利用状況の統計、匿名化後の研究データ、アンケート（任意）等</li>
        </ul>
        <p style={{ fontSize: 13 }}>
          <strong>注意：</strong>児童の個人情報（顔写真・氏名・学籍番号・連絡先等）や学校の内部情報は投稿しないでください。必要な場合でも投稿前に十分なマスキング・ぼかし等を行ってください。PDF/Officeの<strong>ファイル名・プロパティ</strong>も匿名化してください。
        </p>
      </section>

      <section style={{ margin: "2rem 0" }}>
        <h2><strong>第3条（利用目的）</strong></h2>
        <ul>
          <li>本人認証、アカウント管理、本サービスの提供・保守</li>
          <li>授業データの保存・表示・検索・PDF生成・共有等の機能提供</li>
          <li>利便性向上、不正防止、問い合わせ対応、統計的分析</li>
          <li><strong>研究の分析・評価・学術的成果作成</strong>（運営者の管理環境内で匿名化・統計化等の加工を実施）</li>
          <li><strong>本サービスの品質改善</strong>（匿名化・統計化のうえでの評価・検証を含む）</li>
        </ul>
      </section>

      <section style={{ margin: "2rem 0" }}>
        <h2><strong>第4条（第三者提供・委託）</strong></h2>
        <p>法令に基づく場合等を除き、本人の同意なく個人情報を第三者に提供しません。研究・運用のためのクラウド等への委託は、守秘義務と安全管理措置を契約上義務付け、運営者が適切に監督します。<strong>外部の会社に原データを渡して学習させることはしません</strong>。</p>
      </section>

      <section style={{ margin: "2rem 0" }}>
        <h2><strong>第5条（研究成果の公表）</strong></h2>
        <p>研究成果は学会発表・論文・報告書等で公表されることがあります。公表は<strong>個人・学校・投稿が特定されない匿名化された統計・傾向・事例</strong>に限ります。</p>
      </section>

      <section style={{ margin: "2rem 0" }}>
        <h2><strong>第6条（安全管理措置）</strong></h2>
        <p>通信・保存の暗号化、アクセス権限の最小化、ログ監査、バックアップ等、合理的な安全管理措置を講じます。教員名は匿名運用が可能です。</p>
      </section>

      <section style={{ margin: "2rem 0" }}>
        <h2><strong>第7条（参加者の権利）</strong></h2>
        <ul>
          <li>参加者は自身の個人情報の開示・訂正・利用停止・削除を求められます（アプリ内フォームから申請）。</li>
          <li>コンテンツ削除後は、以後に構築・更新される研究用データセットから除外します。既に構築・公表済みの成果・モデルから個別影響を完全に除去することは技術的に困難な場合があります。</li>
          <li>研究参加の中止（同意撤回）を申請できます。以後の研究利用は停止されます。</li>
        </ul>
      </section>

      <section style={{ margin: "2rem 0" }}>
        <h2><strong>第8条（Cookie等）</strong></h2>
        <p>利便性向上やアクセス解析のためCookie等を使用する場合があります。ブラウザで無効化できますが、一部機能に影響する場合があります。</p>
      </section>

      {/* 保有期間・バックアップ30日 */}
      <section style={{ margin: "2rem 0" }}>
        <h2><strong>第9条（保有期間・バックアップ）</strong></h2>
        <p>個人情報は、研究目的・サービス提供の達成に必要な期間、法令で定められた期間、又は参加者がアカウント削除を行うまで保有します。不要となった情報は合理的期間内に削除又は匿名化します。</p>
        <p>障害・災害対策として、暗号化バックアップ（スナップショット/ポイントインタイム）を<strong>最大30日</strong>保持します。復旧はベストエフォートであり、完全復旧は保証されません。</p>
      </section>

      <section style={{ margin: "2rem 0" }}>
        <h2><strong>第10条（改定）</strong></h2>
        <p>本ポリシーは改定されることがあります。重要な変更はアプリ内で周知します。改定後も利用を継続する場合は、変更に同意したものとみなします。</p>
      </section>

      <section style={{ margin: "2rem 0" }}>
        <h2><strong>第11条（問い合わせ窓口）</strong></h2>
        <p>研究参加・データ取扱いに関するお問い合わせは、アプリ内「お問い合わせフォーム」からご連絡ください。</p>
      </section>
    </main>
  );
}
