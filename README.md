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
- Postgres+connect-pg-simpleによるセッションストレージ

### ゲームプレイ
- 10段階の難易度レベル（1〜10）
- 数字の配置と削除
- メモ機能（複数の候補数字をマスに記入）
- 解答の検証機能
- ゲームの保存と再開
- 自動保存機能（30秒ごと）

### ゲーム履歴
- プレイ履歴の表示
- 過去のゲームの再開
- 統計情報の表示
- 難易度ごとのプレイ回数と成功率追跡

### 高度なUI機能
- レスポンシブデザイン（モバイル、タブレット、デスクトップ対応）
- ダークモード対応
- エラー表示（間違った数字の入力時に赤くハイライト）
- 完成時の祝福メッセージとスタッツ表示

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
       const seen = new Set<number>();
       for (let col = 0; col < 9; col++) {
         const value = board[row][col].value;
         if (value !== 0) {
           if (seen.has(value)) {
             errors.add(`row-${row}-${value}`);
           } else {
             seen.add(value);
           }
         }
       }
     }
     
     // 列の重複チェック
     // ...
     
     // 3x3ブロックの重複チェック
     // ...
     
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
ゲームは30秒ごとに自動保存されます：

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