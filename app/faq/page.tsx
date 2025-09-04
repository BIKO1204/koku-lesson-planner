// pages/faq.tsx
export default function FAQPage() {
  const VERSION = "2025-09-04.1";
  const UPDATED = "2025年9月4日";
  return (
    <main style={{ maxWidth: 800, margin: "auto", padding: "2rem" }}>
      <h1>
        よくある質問（FAQ）{" "}
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
          <li>
            <strong>児童の顔写真・氏名・連絡先などはアップロードしないでください。</strong>
            写り込んだ場合はマスキング等で必ず隠してください。
          </li>
          <li>
            保存した授業案・実践記録は、<strong>運営者の管理環境内</strong>
            でアプリ品質向上のために解析・学習利用します（外部の会社へデータ提供はしません）。
          </li>
          <li>
            <strong>バックアップは障害・災害対策として最大30日保持</strong>
            します。復旧は<strong>ベストエフォート</strong>で行い、
            <strong>完全復元は保証できません</strong>。重要なデータはPDF出力等で<strong>自己バックアップ</strong>をお願いします。
          </li>
        </ul>
        <p style={{ fontSize: 13, marginTop: 8 }}>
          参考：<a href="/terms">利用規約</a>／<a href="/privacy">プライバシーポリシー</a>
        </p>
      </section>

      {/* Q1 */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q1:</strong> どんなブラウザや端末で利用できますか？
        </h2>
        <p>
          最新の Chrome / Edge / Safari / Firefox で動作確認しています。スマホ・タブレット・PCで使えます。
        </p>
      </section>

      {/* Q2 */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q2:</strong> サインイン方法は？
        </h2>
        <p>
          現在は Google アカウントでのログインに対応しています。将来、方式が追加・変更されることがあります。
        </p>
      </section>

      {/* Q3 */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q3:</strong> Chromeで開かない・動作が不安定です。
        </h2>
        <ul>
          <li>
            ハードリロード（Windows: <code>Ctrl+F5</code> / Mac:{" "}
            <code>Cmd+Shift+R</code>）
          </li>
          <li>拡張機能（広告ブロッカー等）やプライベートモードをオフ</li>
          <li>Chrome を最新に更新</li>
          <li>改善しなければ Safari / Edge など別ブラウザで再試行</li>
        </ul>
        <p>
          解消しない場合は、お問い合わせフォームに{" "}
          <strong>発生時刻・操作手順・スクリーンショット・ブラウザの種類/バージョン</strong>{" "}
          を添えてご連絡ください。
        </p>
      </section>

      {/* Q4 */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q4:</strong> 同じ Google アカウントなら端末をまたいで使えますか？
        </h2>
        <p>
          はい。同期に時間がかかることがあります。ローカル保存のデータは端末ごとに残るため、
          <strong>削除は各端末で個別に</strong>
          行ってください。表示が残る場合は再読み込み／再ログインで解消することがあります。
        </p>
      </section>

      {/* Q5 */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q5:</strong> 板書画像が共有ページにすぐ反映されません。
        </h2>
        <ul>
          <li>
            画像を追加・削除後は<strong>「プレビュー」ボタン</strong>を押してください。
          </li>
          <li>遅い場合はページ再読み込み／キャッシュクリアをお試しください。</li>
        </ul>
      </section>

      {/* Q6 セキュリティ */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q6:</strong> 個人情報は安全に管理されていますか？
        </h2>
        <p>Firebase 認証とセキュリティルールでアクセス制御を行い、通信は HTTPS で暗号化しています。</p>
      </section>

      {/* Q7 プライバシー */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q7:</strong> プライバシーの考え方は？
        </h2>
        <p>
          取得情報は本サービスの提供・改善の目的に限って利用します。
          <strong>第三者提供は行いません。</strong>詳しくは
          <a href="/privacy">プライバシーポリシー</a>をご確認ください。
        </p>
      </section>

      {/* Q8 MFA */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q8:</strong> アカウント乗っ取り対策は？
        </h2>
        <p>
          Google のセキュリティ基盤を利用しています。将来的に多要素認証（MFA）導入を検討しています。
        </p>
      </section>

      {/* Q9 問い合わせ */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q9:</strong> 問題が起きたらどこに連絡すればいい？
        </h2>
        <p>
          アプリ内の「お問い合わせフォーム」からご連絡ください。
          <strong>発生時刻・操作手順・スクリーンショット・ブラウザ/端末情報</strong>
          があると調査が早く進みます。
        </p>
      </section>

      {/* Q10 料金 */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q10:</strong> 利用料金はかかりますか？
        </h2>
        <p>現在は無料です（運営者が負担）。</p>
      </section>

      {/* Q11 運営費 */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q11:</strong> 運営費はどうしていますか？
        </h2>
        <p>現状は個人負担で無償提供しています。</p>
      </section>

      {/* Q12 将来の費用 */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q12:</strong> 今後の運営費は？
        </h2>
        <p>継続と拡充のため、寄付・助成金・クラウドファンディング等を検討しています。</p>
      </section>

      {/* Q13 支援 */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q13:</strong> 支援や寄付はできますか？
        </h2>
        <p>準備中です。開始時はアプリ内でお知らせします。</p>
      </section>

      {/* Q14 復旧（ベストエフォート／30日保持） */}
      <section
        style={{
          margin: "2rem 0",
          borderTop: "1px solid #eee",
          paddingTop: "1rem",
        }}
      >
        <h2>
          <strong>Q14:</strong> データのバックアップや<strong>復旧（リストア）</strong>はどうなっていますか？
        </h2>
        <p>
          障害・災害対策として、暗号化されたバックアップ（スナップショット／ポイントインタイム・リカバリ）を{" "}
          <strong>最大30日</strong> 保持します。復旧は<strong>ベストエフォート</strong>で実施し、
          <strong>完全復元は保証できません</strong>。復旧に伴い、<strong>一部データの巻き戻りや欠落</strong>
          が生じる可能性があります。運営者は<strong>復元の全責任を負うことはできません</strong>。
        </p>
        <p>
          そのため、重要な授業案・実践記録は、次の方法で<strong>自己バックアップ</strong>をお願いします：
        </p>
        <ul>
          <li>
            授業案画面の<strong>「PDFをダウンロード」</strong>で保存（クラウドドライブ等にも保管）
          </li>
          <li>板書画像は<strong>端末本体にも保存</strong>しておく</li>
          <li>実践記録の本文はテキストでも控えを取る（メモアプリ等）</li>
        </ul>
        <details style={{ marginTop: 8 }}>
          <summary>データを誤って削除した／表示されなくなったときの連絡手順</summary>
          <ol style={{ marginTop: 8 }}>
            <li>できるだけ早く「お問い合わせフォーム」から連絡</li>
            <li>
              次の情報を添付：<br />
              ・発生日時／直前の操作内容
              <br />
              ・授業案（単元名／学年／モデル種別：読解・話し合い・作文・言語活動）
              <br />
              ・実践記録の作成日／作成者名（入力していれば）
              <br />
              ・スクリーンショット（エラーメッセージ等）
              <br />
              ・ブラウザ名・バージョン／端末OS
            </li>
            <li>
              可能であれば、<strong>PDFや画像など手元の控え</strong>も添付
            </li>
          </ol>
          <p style={{ fontSize: 14, color: "#444" }}>
            ※ 復旧の成否・範囲・時期は状況により異なります。詳細は{" "}
            <a href="/terms">利用規約 第16条</a> と{" "}
            <a href="/privacy">プライバシーポリシー 第10条</a> をご確認ください。
          </p>
        </details>
      </section>

      {/* Q15 障害・メンテ */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q15:</strong> 障害やメンテナンス時は？
        </h2>
        <p>
          アプリ内でお知らせします。復旧に努めますが、作業中は一部機能が使えないことがあります。
        </p>
      </section>

      {/* Q16 アップデート */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q16:</strong> アップデートや新機能の予定は？
        </h2>
        <p>定期的に改善・追加を行います。最新情報はアプリ内のお知らせをご覧ください。</p>
      </section>

      {/* 追加：学習利用と同意 */}
      <section
        style={{
          margin: "2rem 0",
          background: "#f3f7ff",
          border: "1px solid #bcd3ff",
          borderRadius: 8,
          padding: "1rem",
        }}
      >
        <h2>
          <strong>Q17:</strong> 学習利用のために同意チェックは必要ですか？
        </h2>
        <p>
          利用規約・プライバシーポリシーに
          <strong>学習利用（運営者の管理環境内での解析）</strong>
          を明記しており、外部の会社へのデータ提供は行いません。通常は追加の同意チェックは不要です。学校や自治体のルールで別途同意が必要な場合は、その指示に従ってください。
        </p>
      </section>

      {/* 追加：児童情報禁止 */}
      <section
        style={{
          margin: "2rem 0",
          background: "#fff0f0",
          border: "1px solid #ffc1c1",
          borderRadius: 8,
          padding: "1rem",
        }}
      >
        <h2>
          <strong>Q18:</strong> 児童の写真や名前を載せてもいいですか？
        </h2>
        <p>
          <strong>載せないでください。</strong>
          児童の顔写真・氏名・学籍番号・連絡先など個人情報が含まれる内容はアップロード禁止です。やむを得ず写り込んだ場合は、
          <strong>投稿前に必ずマスキング・ぼかし</strong>をしてください。
        </p>
      </section>

      {/* 追記：アップロード前の確認・共有・削除等 */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q19:</strong> 「アップロード前の確認」とは何ですか？
        </h2>
        <p>
          PDFや補足資料をアップロードする前に、<strong>個人情報（児童等）や学校の内部情報、第三者著作物</strong>
          が含まれていないかをユーザー自身で点検し、同意チェックで意思表示していただくものです。自動検出や審査を保証する機能ではありません。
          詳細は <a href="/terms">利用規約 第17条</a> をご確認ください。
        </p>
      </section>

      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q20:</strong> 「共有から外す」を押すとどうなりますか？
        </h2>
        <p>
          共有ページで<strong>非表示</strong>になります。データ自体は残るため、投稿者は引き続き利用可能です。検索結果やキャッシュへの反映には時間がかかる場合があります（
          <a href="/terms">利用規約 第6条・第18条</a>）。
        </p>
      </section>

      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q21:</strong> コンテンツを削除したら完全に消えますか？
        </h2>
        <p>
          運用データからは削除されますが、<strong>災害対策のバックアップに最大30日残存</strong>する場合があります。復旧はベストエフォートです（
          <a href="/privacy">プライバシーポリシー 第10条</a>／
          <a href="/terms">利用規約 第16条</a>）。
        </p>
      </section>

      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q22:</strong> アップロードするPDFの推奨仕様は？
        </h2>
        <ul>
          <li>パスワード保護なしの PDF（文字化け防止のため日本語フォント埋め込み推奨）</li>
          <li>スキャンのときは機微情報の黒塗り・塗りつぶしを実施</li>
          <li>サイズが大きいと失敗することがあります。必要に応じて解像度やページ数を調整してください。</li>
        </ul>
        <p style={{ fontSize: 13 }}>
          ※ 上限は将来変更されることがあります。エラー時は分割してアップロードをお試しください。
        </p>
      </section>

      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q23:</strong> 学校の内部資料・配布物はアップロードできますか？
        </h2>
        <p>
          内部情報や非公開資料のアップロードは<strong>避けてください</strong>。必要な場合は、公開可能な範囲に編集・匿名化し、所属組織の規程や著作権・個人情報保護のルールに従ってください（
          <a href="/terms">利用規約 第7条</a>）。
        </p>
      </section>

      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q24:</strong> 著作権・引用の注意点は？
        </h2>
        <p>
          教材・図表・本文は権利者がいます。引用は必要最小限・出典明記・本文と引用の明確な区別等の要件を守ってください。教科書や有償資料のスキャン全体のアップロードは避けてください（
          <a href="/terms">利用規約 第4条・第7条</a>）。
        </p>
      </section>

      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q25:</strong> だれが私の資料を見られますか？
        </h2>
        <p>
          共有しない限り、他ユーザーからは見えません。共有を有効にすると、共有ページから閲覧可能になります。障害対応や運用保守の必要最小限の範囲で、運営者がアクセスする場合があります（
          <a href="/privacy">プライバシーポリシー</a>）。
        </p>
      </section>

      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q26:</strong> 自己バックアップのおすすめは？
        </h2>
        <ul>
          <li>授業案・実践記録の<strong>PDF保存</strong>（クラウドドライブに保管）</li>
          <li>板書画像を端末本体にも保存／整理</li>
          <li>重要メモをテキストでも控える</li>
        </ul>
        <p style={{ fontSize: 13 }}>
          参考：<a href="/terms">利用規約 第16条</a>／<a href="/privacy">プライバシーポリシー 第10条</a>
        </p>
      </section>
    </main>
  );
}
