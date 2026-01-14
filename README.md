# Aozu Ops Hub（あお運用ハブ）

社内向けの運用ナレッジ・テンプレート・チェックリストサイトです。

## 🌐 サイトURL

GitHub Pagesで公開後、以下でアクセスできます：
```
https://[ユーザー名].github.io/[リポジトリ名]/
```

---

## 📁 フォルダ構成

```
あずささん専用サイト/
├── index.html          # メインHTML（SPA）
├── styles.css          # スタイルシート
├── app.js              # JavaScript
├── data/
│   ├── rules.json      # 重要ルール
│   ├── sop.json        # 運用手順（プラットフォーム別）
│   ├── templates.json  # メッセージテンプレート
│   └── cancellation.json # キャンセルポリシー
└── README.md           # このファイル
```

---

## 🚀 GitHub Pagesでの公開手順

### 1. GitHubにリポジトリを作成

1. [GitHub](https://github.com) にログイン
2. 右上の「+」→「New repository」
3. Repository name を入力（例: `aozu-ops-hub`）
4. **Private** を選択（社内限定の場合）
5. 「Create repository」をクリック

### 2. ファイルをアップロード

**方法A: GitHub上で直接アップロード**
1. 「Upload files」をクリック
2. すべてのファイルとフォルダをドラッグ＆ドロップ
3. 「Commit changes」をクリック

**方法B: Git コマンドを使用**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/[ユーザー名]/[リポジトリ名].git
git push -u origin main
```

### 3. GitHub Pages を有効化

1. リポジトリページで「Settings」タブを開く
2. 左メニューの「Pages」をクリック
3. Source で「Deploy from a branch」を選択
4. Branch で「main」を選択、フォルダは「/(root)」
5. 「Save」をクリック
6. 数分待つと公開される

---

## 🔧 データの編集方法

### テンプレートを追加する

`data/templates.json` を編集：

```json
{
    "id": "tpl-新しいID",
    "category": "カテゴリ名",
    "platform": ["対象プラットフォーム"],
    "title": "テンプレート名",
    "body": "本文...",
    "emoji_version": "絵文字版（任意）"
}
```

### SOPを追加する

`data/sop.json` を編集：

```json
{
    "id": "プラットフォームID",
    "platform": "プラットフォーム名",
    "icon": "🏠",
    "loginUrl": "ログインURL",
    "hostApp": "アプリURL（任意）",
    "credentialNote": "保管先: 社内パスワード管理シート",
    "tips": ["注意点1", "注意点2"],
    "checkOrder": ["確認1", "確認2"]
}
```

---

## 🔐 セキュリティ・アクセス制限について

### Privateリポジトリ + Collaborator招待（推奨）

このサイトは **bluespace.yama@gmail.com** のアカウントでPrivateリポジトリとして管理し、閲覧者をCollaboratorとして招待することでアクセスを制限します。

#### Collaboratorを招待する手順

1. リポジトリページで「Settings」タブを開く
2. 左メニューの「Collaborators and teams」をクリック
3. 「Add people」ボタンをクリック
4. 招待したい人の **GitHubユーザー名** または **メールアドレス** を入力
5. 「Add [ユーザー名] to this repository」をクリック
6. 招待された人がメールで承認するとアクセス可能に

#### 招待された人の手順

1. GitHubアカウントを作成（無料）
2. 招待メールを確認して「Accept invitation」をクリック
3. 以下のURLでサイトにアクセス：
   ```
   https://[ユーザー名].github.io/[リポジトリ名]/
   ```

> ⚠️ **注意**: Privateリポジトリでも GitHub Pages は公開状態になります。
> 完全な非公開が必要な場合は GitHub Enterprise または別のホスティングが必要です。

### セキュリティルール

- **パスワードやIDは絶対に記載しない**
- 「保管先: 社内パスワード管理シート」と記載
- プレースホルダ `{{社内シートURL}}` は後から差し替え

---

## 💾 データ保存について

以下のデータはブラウザの localStorage に保存されます：

- ✅ 日次チェックリストの状態
- 📝 自分用メモ
- ☑️ 重要ルールの確認状態
- 📚 学びログ（JSONエクスポート可能）

※ ブラウザを変えると消えます

---

## 📱 対応ブラウザ

- Chrome（推奨）
- Safari
- Firefox
- Edge

スマートフォンでも快適に使えます。

---

## 🆘 トラブルシューティング

### Q: ページが表示されない
- GitHub Pagesの公開設定を確認
- 数分待ってからリロード

### Q: データが読み込まれない
- `data/` フォルダがアップロードされているか確認
- JSONファイルの構文エラーがないか確認

### Q: メモが消えた
- 別のブラウザで開いていないか確認
- プライベートブラウジングモードでは保存されません
