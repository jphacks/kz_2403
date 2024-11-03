// edge functionのURLを構築する関数

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "/../../.env") });

export const buildEdgeUrl = (pathKey: string): string => {
  // 環境変数を取得
  const baseUrl = process.env.EDGE_FUNCTION_BASE_URL;
  const pathsJson = process.env.EDGE_FUNCTION_PATHS;

  if (!baseUrl || !pathsJson) {
    throw new Error("Edge Function環境変数が設定されていません");
  }

  try {
    // Edge Functionのパスを取得
    const paths: EdgeFunctionPaths = JSON.parse(pathsJson); // TypeScriptのオブジェクトにする
    const path = paths[pathKey];

    if (!path) {
      throw new Error(`指定されたパスキー "${pathKey}" が見つかりません`);
    }

    return `${baseUrl}${path}`;
  } catch (error) {
    throw new Error(`Edge Function URLの構築エラー: ${error}`);
  }
};
