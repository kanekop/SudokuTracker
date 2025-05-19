# 数独（Sudoku）ゲーム - プロジェクト説明書

## 概要
このプロジェクトは、10段階の難易度を持つ数独ゲームアプリケーションです。ユーザーは名前のみで簡単にサインインでき、ゲームの進行状況が保存され、過去のパズルをプレイし直すことも可能です。

## 技術スタック
- フロントエンド: React.js + TypeScript
- バックエンド: Express.js + TypeScript
- データベース: PostgreSQL
- ORM: Drizzle ORM
- 状態管理: React Query
- スタイリング: Tailwind CSS + shadcn/ui

## プロジェクト構造

### 主要ディレクトリ
- `/client`: フロントエンドのコード
  - `/src/components`: UIコンポーネント
  - `/src/hooks`: カスタムReactフック
  - `/src/lib`: ユーティリティ関数
  - `/src/pages`: アプリケーションのページ
- `/server`: バックエンドのコード
  - `routes.ts`: APIエンドポイント
  - `storage.ts`: データアクセスレイヤー
  - `db.ts`: データベース接続
- `/shared`: フロントエンドとバックエンドで共有されるコード
  - `schema.ts`: データモデルとスキーマ定義

### 主要ファイル
- `client/src/pages/Game.tsx`: メインのゲーム画面
- `client/src/hooks/useSudoku.ts`: 数独ゲームのロジックを扱うカスタムフック
- `client/src/lib/sudoku.ts`: 数独パズル生成と検証のアルゴリズム
- `server/routes.ts`: APIエンドポイントの定義
- `shared/schema.ts`: データベーススキーマとタイプ定義

## 機能一覧

### ユーザー認証
- 名前のみの簡易サインイン
- セッション管理による状態保持

### ゲームプレイ
- 10段階の難易度レベル（1〜10）
- 数字の配置と削除
- メモ機能（複数の候補数字をマスに記入）
- 解答の検証機能
- ゲームの保存と再開

### ゲーム履歴
- プレイ履歴の表示
- 過去のゲームの再開
- 統計情報の表示

## APIエンドポイント

### 認証関連
- `POST /api/auth/login`: ログイン
- `GET /api/auth/me`: 現在のユーザー情報取得
- `POST /api/auth/logout`: ログアウト

### ゲーム関連
- `POST /api/games`: 新規ゲーム作成
- `GET /api/games/:id`: 特定のゲーム情報取得
- `PATCH /api/games/:id`: ゲーム状態の更新
- `GET /api/games`: ユーザーのゲーム一覧取得
- `GET /api/stats`: ユーザーの統計情報取得

## データモデル

### User
ユーザー情報を格納します。
```typescript
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  password: text("password").notNull(),
});
```

### Game
ゲームの状態を格納します。
```typescript
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  difficulty: integer("difficulty").notNull(),
  initialBoard: text("initial_board").notNull(),
  currentBoard: text("current_board").notNull(),
  solvedBoard: text("solved_board").notNull(),
  timeSpent: integer("time_spent").notNull().default(0),
  isCompleted: boolean("is_completed").notNull().default(false),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});
```

## 実装詳細

### 数独パズル生成アルゴリズム
`client/src/lib/sudoku.ts`に実装されています。以下のステップでパズルを生成します:
1. 解答済みの完全な9x9の盤面を生成
2. 難易度に応じて一部のマスを空白にする
3. 一意解が保証されるように調整

### ゲームロジック
`client/src/hooks/useSudoku.ts`に実装されています。主な機能:
- マスの選択と数字の入力
- メモモードの切り替え
- ゲーム状態の検証
- エラー検出

### データ永続化
PostgreSQLデータベースを使用して、以下の情報を保存します:
- ユーザー情報
- ゲーム状態（初期盤面、現在の盤面、解答盤面）
- プレイ時間や完了状態などのメタデータ

## 開発ガイド

### 環境設定
1. `.env`ファイルを作成し、以下の環境変数を設定:
   ```
   DATABASE_URL=postgresql://[ユーザー名]:[パスワード]@[ホスト]:[ポート]/[データベース名]
   SESSION_SECRET=任意の安全な文字列
   ```

2. 依存関係のインストール:
   ```bash
   npm install
   ```

3. データベースのセットアップ:
   ```bash
   npm run db:push
   ```

4. 開発サーバーの起動:
   ```bash
   npm run dev
   ```

### エラーと対処法

#### 数独パズル生成エラー
問題が発生している場合、`generateSudoku`関数内のバックトラッキングアルゴリズムをデバッグします:
```javascript
// client/src/lib/sudoku.ts の該当部分
function generateSolvedBoard(): number[][] {
  // ...実装...
}
```

#### APIエラー
1. データベース接続を確認:
   ```typescript
   // server/db.ts
   export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
   ```

2. セッション管理を確認:
   ```typescript
   // server/routes.ts
   if (!req.session || !req.session.userId) {
     return res.status(401).json({ message: "Not authenticated" });
   }
   ```

#### フロントエンドエラー
React Queryキャッシュの問題が発生した場合:
```typescript
// client/src/lib/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});
```

## 今後の改善点
1. ヒント機能の実装（現バージョンでは削除済み）
2. 複数の難易度選択の改良
3. モバイル向けUIの最適化
4. ゲーム統計情報の拡充

## ライセンス
このプロジェクトは、MITライセンスの下で提供されています。詳細はLICENSEファイルをご覧ください。