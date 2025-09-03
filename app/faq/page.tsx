// pages/faq.tsx
export default function FAQPage() {
  const VERSION = "2025-09-02";
  const UPDATED = "2025年9月2日";
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
            <strong>
              復元（リストア）は運営側で対応可能です（Point-in-Time Recovery＋定期バックアップの保持期間内）。
            </strong>
            ただし<strong>ユーザーの自己復元機能は未提供</strong>です。重要なデータは
            <strong>PDF出力や端末内保存など各自でもバックアップ</strong>をお願いします。
            なお、復元は<strong>ベストエフォート</strong>であり、
            <strong>完全復旧の保証はできません（復元に関する最終的な結果について当方は責任を負いかねます）</strong>。
          </li>
        </ul>
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
          取得情報は本サービスの提供・改善の目的に限って利用します。<strong>第三者提供は行いません。</strong>
          詳しくはプライバシーポリシーをご確認ください。
        </p>
      </section>

      {/* Q8 MFA */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q8:</strong> アカウント乗っ取り対策は？
        </h2>
        <p>Google のセキュリティ基盤を利用しています。将来的に多要素認証（MFA）導入を検討しています。</p>
      </section>

      {/* Q9 問い合わせ */}
      <section style={{ margin: "2rem 0" }}>
        <h2>
          <strong>Q9:</strong> 問題が起きたらどこに連絡すればいい？
        </h2>
        <p>
          アプリ内の「お問い合わせフォーム」からご連絡ください。<strong>発生時刻・操作手順・スクリーンショット・ブラウザ/端末情報</strong>
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

      {/* Q14 復元（運営側対応可） */}
      <section style={{ margin: "2rem 0", borderTop: "1px solid #eee", paddingTop: "1rem" }}>
        <h2>
          <strong>Q14:</strong> データのバックアップや<strong>復元（リストア）</strong>はどうなっていますか？
        </h2>

        <p>
          <strong>運営側での復元対応が可能になりました。</strong>
          次の方法で、<strong>保持期間内</strong>のデータに限り復元を試みます。
        </p>
        <ul>
          <li>
            <strong>Point-in-Time Recovery（PITR）:</strong>{" "}
            直近の誤削除・誤上書きなどに対して、指定時刻の状態へ復元。
          </li>
          <li>
            <strong>定期バックアップ（スナップショット）:</strong>{" "}
            PITRより前の時点や、長期保管分を対象に復元。
          </li>
        </ul>

        <p style={{ marginTop: 12 }}>
          ただし、<strong>ユーザーが自分でボタンひとつで復元する機能は未提供</strong>です。
          重要な授業案・実践記録は、引き続き次の方法で<strong>各自でもバックアップ</strong>してください。
        </p>
        <ul>
          <li>
            授業案画面の<strong>「PDFをダウンロード」</strong>で保存（クラウドドライブ等にも保管）
          </li>
          <li>板書画像は<strong>端末本体にも保存</strong>しておく</li>
          <li>実践記録の本文はメモアプリ等に<strong>テキスト控え</strong>を取る</li>
        </ul>

        <details style={{ marginTop: 8 }}>
          <summary>復元依頼の手順（できるだけ早くご連絡ください）</summary>
          <ol style={{ marginTop: 8 }}>
            <li>アプリ内の「お問い合わせフォーム」から<strong>復元希望</strong>の旨を連絡</li>
            <li>
              次の情報を添付：<br />
              ・発生日時／直前の操作内容<br />
              ・対象（授業案 or 実践記録）と識別情報（単元名／学年／モデル種別：読解・話し合い・作文・言語活動）<br />
              ・スクリーンショット（エラー表示があれば）<br />
              ・ブラウザ名・バージョン／端末OS
            </li>
            <li>可能であれば、<strong>PDFや画像など手元の控え</strong>も添付</li>
          </ol>
        </details>

        <p style={{ fontSize: 14, color: "#444", marginTop: 12 }}>
          【ご注意】保持期間外のデータは復元できません。復元は基本的に
          <strong>ベストエフォート</strong>で行い、<strong>完全復旧・欠損ゼロは保証できません</strong>。
          主に<strong>Firestoreデータ</strong>が対象で、認証情報（Auth）や画像ファイル（Storage）等は
          別途の手順が必要な場合があります。復元作業に起因する結果・損害について、
          <strong>当方は最終的な責任を負いかねます</strong>（利用規約をご確認ください）。
        </p>
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
          利用規約・プライバシーポリシーに<strong>学習利用（運営者の管理環境内での解析）</strong>
          を明記しており、外部の会社へのデータ提供は行いません。通常は追加の同意チェックは不要です。
          学校や自治体のルールで別途同意が必要な場合は、その指示に従ってください。
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
          児童の顔写真・氏名・学籍番号・連絡先など個人情報が含まれる内容はアップロード禁止です。
          やむを得ず写り込んだ場合は、<strong>投稿前に必ずマスキング・ぼかし</strong>をしてください。
        </p>
      </section>
    </main>
  );
}
