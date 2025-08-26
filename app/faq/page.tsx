export default function FAQPage() {
  return (
    <main style={{ maxWidth: 800, margin: "auto", padding: "2rem" }}>
      <h1>よくある質問（FAQ）</h1>

      {/* Q1 */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q1:</strong> どんなブラウザや端末で利用できますか？
        </h2>
        <p>
          最新版の主要ブラウザ（Chrome / Edge / Safari / Firefox）で動作確認済みです。スマートフォン・タブレット・PCのいずれでもご利用いただけます。
        </p>
      </section>

      {/* Q2 */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q2:</strong> サインイン方法にはどんなものがありますか？
        </h2>
        <p>
          現在はGoogleアカウントでのログインを提供しています。提供方式は今後変更・追加される場合があります。
        </p>
      </section>

      {/* Q3 */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q3:</strong> Chromeでアプリが開かない・動作しないときは？
        </h2>
        <ul>
          <li>ハードリロード（Windows: <code>Ctrl+F5</code> / Mac: <code>Cmd+Shift+R</code>）。</li>
          <li>拡張機能（広告ブロッカー等）やプライベートモードを一時停止。</li>
          <li>Chromeを最新バージョンへ更新。</li>
          <li>改善しない場合はSafari / Edgeなど別ブラウザで再試行。</li>
          <li>解決しない場合はお問い合わせフォームからご連絡ください。</li>
        </ul>
      </section>

      {/* Q4 */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q4:</strong> 同じGoogleアカウントでログインすれば、端末をまたいで使えますか？
        </h2>
        <p>
          はい、使えます。同期の反映に時間がかかることがあります（ローカル保存・キャッシュ等の影響）。また、一部データは端末ごとにローカル保存されるため、<strong>削除は各端末で個別に実行してください。</strong>表示が残る場合は再読み込み／再ログインで解消します。
        </p>
      </section>

      {/* Q5 */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q5:</strong> 実践案の板書画像が共有版ページにすぐ反映されません。どうすれば良いですか？
        </h2>
        <ul>
          <li>画像の追加・削除後は、<span style={{ fontWeight: 700 }}>「プレビュー」</span>ボタンを押してください。</li>
          <li>反映が遅い場合はページ再読み込みやキャッシュクリアをお試しください。</li>
        </ul>
      </section>

      {/* Q6 */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q6:</strong> 個人情報は安全に管理されていますか？
        </h2>
        <p>
          はい。Firebaseの認証とセキュリティルールでユーザーごとの権限を厳格に管理しています。通信はHTTPSで暗号化されています。
        </p>
      </section>

      {/* Q7 */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q7:</strong> プライバシーはどのように守られていますか？
        </h2>
        <p>
          取得情報は授業支援の目的に限定して利用し、関連法令に基づき適切に管理します。第三者提供は行いません。
        </p>
      </section>

      {/* Q8 */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q8:</strong> アカウント乗っ取りが心配です。対策はありますか？
        </h2>
        <p>
          GoogleログインはGoogleのセキュリティ基盤で保護されています。匿名認証は端末固有情報を用い、不正利用を抑制します。将来的に多要素認証（MFA）の導入も検討しています。
        </p>
      </section>

      {/* Q9 */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q9:</strong> 問題が発生したら、どこに連絡すれば良いですか？
        </h2>
        <p>
          お問い合わせフォーム（サポート窓口）からご連絡ください。状況・再現手順・画面のスクリーンショット等を添えていただけると助かります。
        </p>
      </section>

      {/* Q10 */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q10:</strong> このサービスの利用に費用はかかりますか？
        </h2>
        <p>
          現在は無料でご利用いただけます（運営費用は開発者が負担）。
        </p>
      </section>

      {/* Q11 */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q11:</strong> 運営費用はどのように賄っていますか？
        </h2>
        <p>
          現状、サーバー費用や運営費は個人負担で無償提供しています。
        </p>
      </section>

      {/* Q12 */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q12:</strong> 今後の運営・開発費用はどうする予定ですか？
        </h2>
        <p>
          サービス継続と拡充のため、寄付・助成金・クラウドファンディング等の活用を検討しています。
        </p>
      </section>

      {/* Q13 */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q13:</strong> 支援や寄付はどのようにできますか？
        </h2>
        <p>
          準備中です。開始時はアプリ内通知や関係者へのご案内でお知らせします。
        </p>
      </section>

      {/* Q14 */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q14:</strong> データのバックアップや復元はどうなっていますか？
        </h2>
        <p>
          重要データはFirebaseクラウド上で定期的にバックアップしています。万一の場合も迅速に復元できる体制を整えています。
        </p>
      </section>

      {/* Q15 */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q15:</strong> 障害やメンテナンス時はどうなりますか？
        </h2>
        <p>
          障害や計画メンテナンス時はアプリ内通知でお知らせし、復旧に努めます。
        </p>
      </section>

      {/* Q16 */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q16:</strong> アップデートや新機能の予定はありますか？
        </h2>
        <p>
          定期的に機能追加・改善を行っています。最新情報はアプリ内のお知らせをご確認ください。
        </p>
      </section>
    </main>
  );
}
