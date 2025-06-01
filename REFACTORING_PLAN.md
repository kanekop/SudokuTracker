# コンポーネントリファクタリング計画

## 現在の構造の問題点
1. `client/src/components/` 直下に機能別コンポーネントが混在
2. 関連するコンポーネント同士のグループ化がされていない
3. shadcn/uiのコンポーネントが多数存在し、ディレクトリが大きい

## 提案する新しい構造

```
client/src/components/
├── ui/                     # shadcn/uiコンポーネント（現状維持）
│   ├── button.tsx
│   ├── dialog.tsx
│   └── ...
├── game/                   # ゲーム関連のコンポーネント
│   ├── SudokuBoard.tsx
│   ├── NumberPad.tsx
│   ├── GameControls.tsx
│   ├── DifficultySelector.tsx
│   └── index.ts            # エクスポート用
├── modals/                 # モーダル関連
│   ├── CompletionModal.tsx
│   ├── LoginModal.tsx
│   └── index.ts
├── layout/                 # レイアウト関連
│   ├── Header.tsx
│   ├── TabsNavigation.tsx
│   └── index.ts
└── common/                 # 汎用コンポーネント
    ├── LoadingSpinner.tsx
    ├── ErrorBoundary.tsx
    └── index.ts
```

## リファクタリングの利点
1. **関心の分離**: 機能ごとにコンポーネントをグループ化
2. **保守性向上**: 関連コンポーネントを探しやすい
3. **再利用性**: 各カテゴリのindex.tsでエクスポートを管理
4. **スケーラビリティ**: 新機能追加時の配置が明確

## 実装手順
1. 新しいディレクトリ構造の作成
2. コンポーネントの移動
3. インポート文の更新
4. index.tsファイルの作成

## 追加の改善案
1. **カスタムフックの整理**
   - `hooks/game/` - ゲーム関連フック
   - `hooks/auth/` - 認証関連フック
   - `hooks/ui/` - UI関連フック

2. **utilsの整理**
   - `lib/game/` - ゲームロジック
   - `lib/auth/` - 認証ロジック
   - `lib/api/` - API関連

3. **型定義の整理**
   - `types/game.ts` - ゲーム関連型
   - `types/auth.ts` - 認証関連型
   - `types/api.ts` - API関連型