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
- 名前のみの簡易サインイン（パスワード不要）
- 存在しないユーザー名の場合は自動で新規ユーザー作成
- セッション管理による状態保持
- Postgres+connect-pg-simpleによるセッションストレージ

### ゲームプレイ
- 10段階の難易度レベル（1〜10）
- 数字の配置と削除
- メモ機能（複数の候補数字をマスに記入）
- 解答の検証機能
- ゲームの保存と再開
- 自動保存機能（30秒ごと、ログインユーザーのみ）
- エラー検出（重複数字の赤色ハイライト表示）

### ゲーム履歴
- プレイ履歴の表示
- 過去のゲームの再開
- 統計情報の表示
- 難易度ごとのプレイ回数と成功率追跡

### 高度なUI機能
- レスポンシブデザイン（モバイル、タブレット、デスクトップ対応）
- エラー表示（間違った数字の入力時に赤くハイライト）
- 完成時の祝福メッセージとスタッツ表示
- ゲーム板の左側配置とコントロールボタンの右側配置
- Tailwind CSS + shadcn/ui による一貫したデザインシステム

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
  username: text("username").notNull().unique(),
});
```

### Game
ゲームの状態を格納します。
```typescript
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  difficulty: integer("difficulty").notNull(),
  initialBoard: text("initial_board").notNull(), // JSON string of 9x9 board
  currentBoard: text("current_board").notNull(), // JSON string of 9x9 board
  solvedBoard: text("solved_board").notNull(), // JSON string of 9x9 board
  timeSpent: integer("time_spent").default(0), // in seconds
  isCompleted: boolean("is_completed").default(false),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
});
```

## 実装詳細

### 数独パズル生成アルゴリズム
`client/src/lib/sudoku.ts`に実装されています。以下のステップでパズルを生成します:
1. 解答済みの完全な9x9の盤面を生成（バックトラッキングアルゴリズム）
2. 難易度に応じて一部のマスを空白にする
3. 一意解が保証されるように調整

#### 難易度アルゴリズムの詳細
数独の難易度は1〜10の10段階で設定されており、以下の要素によって決定されます：

1. **空白マスの数** (難易度1-10による調整)
   - 難易度1: 約30マス（81マス中）
   - 難易度5: 約45マス
   - 難易度10: 約60マス

2. **マス削除のパターン**
   ```typescript
   function createPuzzle(solvedBoard: number[][], difficulty: Difficulty): Board {
     // 難易度に応じて削除するマスの数を計算
     const cellsToRemove = 30 + (difficulty - 1) * 3;
     
     // 削除候補のマスの座標をシャッフル
     const positions = [];
     for (let i = 0; i < 9; i++) {
       for (let j = 0; j < 9; j++) {
         positions.push([i, j]);
       }
     }
     shuffleArray(positions);
     
     // 盤面のコピーを作成
     const puzzle = JSON.parse(JSON.stringify(solvedBoard));
     
     // マスを削除していく
     let removed = 0;
     for (const [row, col] of positions) {
       // 一時的に値を除去
       const temp = puzzle[row][col];
       puzzle[row][col] = 0;
       
       // 一意解を持つかチェック
       const solutions = countSolutions(puzzle);
       
       if (solutions === 1) {
         // 一意解があるなら削除確定
         removed++;
         if (removed >= cellsToRemove) break;
       } else {
         // 一意解でなければ値を戻す
         puzzle[row][col] = temp;
       }
     }
     
     // Board型に変換して返す処理
     // ...
   }
   ```

3. **難易度レベル別の特徴**
   - **レベル1-3 (初級)**:
     - 少ない空白マス（約30-36マス）
     - 論理的推論のみで解ける
     - ナンプレ初心者でも解ける難易度
   
   - **レベル4-7 (中級)**:
     - 中程度の空白マス（約37-51マス）
     - 「X-Wing」や「隠れたペア」など、やや高度な解法が必要
     - 経験者向けの難易度
   
   - **レベル8-10 (上級)**:
     - 多くの空白マス（約52-60マス）
     - 「スウォードフィッシュ」や「XYZ-Wing」など、高度な解法が必要
     - 上級者、専門家向けの難易度
     
4. **解法の検証アルゴリズム**
   アプリケーションでは、ユーザーが入力した解答を検証するために、以下のようなアルゴリズムを使用しています：
   
   ```typescript
   export function isBoardCorrect(currentBoard: Board, solvedBoard: Board): boolean {
     for (let row = 0; row < 9; row++) {
       for (let col = 0; col < 9; col++) {
         if (currentBoard[row][col].value !== 0 && 
             currentBoard[row][col].value !== solvedBoard[row][col].value) {
           return false;
         }
       }
     }
     return true;
   }
   
   export function getBoardErrors(board: Board): Set<string> {
     const errors = new Set<string>();
     
     // 行の重複チェック
     for (let row = 0; row < 9; row++) {
       const values = new Set<number>();
       for (let col = 0; col < 9; col++) {
         const value = board[row][col].value;
         if (value !== 0) {
           if (values.has(value)) {
             errors.add(`r${row}c${col}`);
           } else {
             values.add(value);
           }
         }
       }
     }
     
     // 列の重複チェック
     for (let col = 0; col < 9; col++) {
       const values = new Set<number>();
       for (let row = 0; row < 9; row++) {
         const value = board[row][col].value;
         if (value !== 0) {
           if (values.has(value)) {
             errors.add(`r${row}c${col}`);
           } else {
             values.add(value);
           }
         }
       }
     }
     
     // 3x3ブロックの重複チェック
     for (let blockRow = 0; blockRow < 3; blockRow++) {
       for (let blockCol = 0; blockCol < 3; blockCol++) {
         const values = new Set<number>();
         for (let row = blockRow * 3; row < blockRow * 3 + 3; row++) {
           for (let col = blockCol * 3; col < blockCol * 3 + 3; col++) {
             const value = board[row][col].value;
             if (value !== 0) {
               if (values.has(value)) {
                 errors.add(`r${row}c${col}`);
               } else {
                 values.add(value);
               }
             }
           }
         }
       }
     }
     
     return errors;
   }
   ```

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

#### データベースとDrizzle ORMの連携
Drizzle ORMを使用してPostgreSQLとの連携を行っています。

```typescript
// server/db.ts
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
```

#### ゲームデータの保存方法
ゲーム盤面はJSON文字列としてデータベースに保存されます：

```typescript
// server/storage.ts (DatabaseStorage クラス)
async createGame(insertGame: InsertGame): Promise<Game> {
  const [game] = await db
    .insert(games)
    .values(insertGame)
    .returning();
  return game;
}

async updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined> {
  const [updatedGame] = await db
    .update(games)
    .set(updates)
    .where(eq(games.id, id))
    .returning();
  return updatedGame;
}
```

#### 自動保存機能
ゲームは30秒ごとに自動保存されます（ログインユーザーのみ）：

```typescript
// client/src/pages/Game.tsx
useEffect(() => {
  const saveInterval = setInterval(() => {
    if (isLoggedIn && currentGameId && !sudoku.gameCompleted) {
      sudoku.saveGame(timer.seconds);
    }
  }, 30000);
  
  return () => clearInterval(saveInterval);
}, [isLoggedIn, currentGameId, sudoku.gameCompleted, timer.seconds]);
```

注意: 現在のバージョンではタイマー機能は削除されているため、実際の実装では`timer.seconds`の代わりに別の時間管理方法を使用しています。

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

### プロジェクト構成ガイド
新規開発者がこのプロジェクトに関わる際の参考情報です。

#### パッケージの依存関係
- **フロントエンド UI**: `shadcn/ui` - Tailwind CSSベースのコンポーネントライブラリ
- **状態管理**: `@tanstack/react-query` - サーバー状態管理と非同期処理
- **ルーティング**: `wouter` - シンプルなルーターライブラリ
- **フォーム管理**: `react-hook-form` + `zod` - タイプセーフなフォームバリデーション
- **ORM**: `drizzle-orm` - TypeScriptファーストのORM
- **バックエンド**: `express` + `passport` - セッション認証付きREST API

#### アーキテクチャパターン

1. **バックエンド**
   - `server/routes.ts` - すべてのAPI定義を含む単一ファイル
   - `server/storage.ts` - DDD（ドメイン駆動設計）的アプローチで、データベースアクセスを抽象化
   - `shared/schema.ts` - フロントエンドとバックエンドで共有される型定義

2. **フロントエンド**
   - `client/src/hooks/` - カスタムフックによるロジック分離
   - `client/src/components/` - UI部品の定義（shadcn/uiベース）
   - `client/src/pages/` - ページコンポーネントとルーティング

#### 開発ワークフロー
1. 新機能開発の一般的な流れ：
   ```
   型定義の追加 (shared/schema.ts)
   → データベース関数の追加 (server/storage.ts)
   → APIエンドポイントの実装 (server/routes.ts)
   → フロントエンドロジックの実装 (client/src/hooks/)
   → UIコンポーネントの実装 (client/src/components/, client/src/pages/)
   ```

2. デバッグのポイント：
   - バックエンドのログは `console.log` でサーバーコンソールに出力
   - フロントエンドのデバッグには React DevTools と Network タブを活用
   - セッション関連の問題は `server/routes.ts` の express-session 設定や `server/storage.ts` のセッションストア実装を確認

3. テスト方法：
   - 現在、自動テストは実装されていません
   - 手動テストのチェックリスト（重要機能）：
     - ユーザー登録・ログイン
     - 各難易度のゲーム作成
     - ゲームプレイ（数字入力、メモ機能、エラー表示）
     - ゲーム保存と再開
     - 統計情報の表示

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

## コントリビューションガイド

### コーディング規約
1. **TypeScript**
   - 必ず型を明示的に定義する
   - `any` 型の使用を避ける
   - インターフェースとタイプエイリアスを適切に使い分ける

2. **コンポーネント設計**
   - 小さくて再利用可能なコンポーネントを作る
   - Propsには明示的に型を定義する
   - 状態管理と表示ロジックを分離する

3. **バックエンド**
   - 非同期処理には常に適切なエラーハンドリングを実装する
   - データベース操作は storage.ts 内に集約する
   - API レスポンスは一貫したフォーマットで返す

### ブランチ戦略
- `main`: 安定版コード
- `develop`: 開発中のコード
- `feature/*`: 新機能開発用
- `bugfix/*`: バグ修正用

### プルリクエスト
1. できるだけ小さく、一つの機能や修正に集中したPRを作成
2. タイトルと説明に変更内容を明記
3. レビュー前に自己チェックを行う

## トラブルシューティング

### よくある問題と解決策

1. **セッションが維持されない**
   - `server/routes.ts` の express-session 設定を確認
   - PostgreSQL sessionStore の接続を確認

2. **ゲーム盤面が正しく表示されない**
   - JSON形式の解析エラーを確認
   - `JSON.parse(board)` で例外が発生していないかチェック

3. **データベース接続エラー**
   - `.env` ファイルの `DATABASE_URL` が正しいか確認
   - データベースサーバーが稼働しているか確認
   - `npm run db:push` でスキーマが最新かチェック

4. **型エラー**
   - `shared/schema.ts` で型定義が正しいか確認
   - 末端コンポーネントでの型変換に注意

5. **パフォーマンス問題**
   - 数独パズル生成時のアルゴリズム最適化を検討
   - 不要なレンダリングを避けるため `useMemo` や `useCallback` の使用を検討
   - React Query のキャッシュ戦略を見直す

## 今後の改善点
1. ヒント機能の実装（現バージョンでは削除済み）
2. タイマー機能の復活（現バージョンでは削除済み）
3. 複数の難易度選択の改良
4. モバイル向けUIの最適化
5. ゲーム統計情報の拡充
6. テストの自動化（Jest + React Testing Library）
7. 国際化対応（i18next による多言語サポート）
8. オフライン対応（PWA機能の追加）
9. ダークモード実装
10. ユーザープロフィール機能
11. ランキング機能

## ライセンス
このプロジェクトは、MITライセンスの下で提供されています。詳細はLICENSEファイルをご覧ください。