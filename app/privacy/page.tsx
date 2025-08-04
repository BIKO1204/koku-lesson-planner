export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 800, margin: "auto", padding: "2rem" }}>
      <h1>プライバシーポリシー</h1>

      <section style={{ margin: "2rem 0" }}>
        <h2><strong>第1条（収集する情報）</strong></h2>
        <p>
          ・Googleアカウント等のログイン情報（氏名、メールアドレス）<br />
          ・授業案や実践記録、板書画像などの投稿データ<br />
          ・アクセスログ（Firebase等の技術により取得）
        </p>
      </section>

      <section style={{ margin: "2rem 0" }}>
        <h2><strong>第2条（利用目的）</strong></h2>
        <p>
          ・ユーザー認証と本人確認<br />
          ・授業データの保存と表示<br />
          ・利便性の向上と分析<br />
          ・教育研究への活用（匿名化した上で）
        </p>
      </section>

      <section style={{ margin: "2rem 0" }}>
        <h2><strong>第3条（第三者提供）</strong></h2>
        <p>
          法令に基づく場合を除き、第三者に個人情報を提供しません。
        </p>
      </section>

      <section style={{ margin: "2rem 0" }}>
        <h2><strong>第4条（情報の管理）</strong></h2>
        <p>
          Firebase等のクラウドサービス上で安全に管理され、漏洩や不正アクセスの防止に努めます。
        </p>
      </section>

      <section style={{ margin: "2rem 0" }}>
        <h2><strong>第5条（ユーザーの権利）</strong></h2>
        <p>
          ユーザーは、自身の個人情報について開示・訂正・削除を求めることができます。<br />
          お問い合わせは、アプリ内の「お問い合わせフォーム」からお願いします。
        </p>
      </section>

      <section style={{ margin: "2rem 0" }}>
        <h2><strong>第6条（Cookieの利用）</strong></h2>
        <p>
          当アプリは、アクセス解析のためにCookie等を使用する場合がありますが、個人を特定する情報は含みません。
        </p>
      </section>

      <section style={{ margin: "2rem 0" }}>
        <h2><strong>第7条（改定）</strong></h2>
        <p>
          本ポリシーは、予告なく変更されることがあります。変更内容はアプリ内に掲示します。
        </p>
      </section>
    </main>
  );
}
