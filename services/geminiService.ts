import { GoogleGenAI } from "@google/genai";
import { OutlineData } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const jsonSchemaString = JSON.stringify({
  title: "ユーザーのキーワードに基づいて提案された、魅力的でSEOに適したタイトル",
  outline: [
    {
      section: "構成案のセクションタイトル (例: 「1. 導入」)",
      subsections: ["そのセクションでカバーすべき具体的なサブトピックや要点のリスト"]
    }
  ]
}, null, 2);


export async function generateOutline(topic: string): Promise<OutlineData> {
  const prompt = `
あなたはプロのコンテンツストラテジスト兼、SEOエキスパートです。
以下のタイトルまたはキーワードについて、Google検索を実行し、検索結果の上位10記事を分析してください。

タイトル/キーワード: "${topic}"

分析のポイント：
- 各記事がどのようなトピックや質問に答えているか
- 共通して含まれるH2、H3見出しは何か
- どのような検索意図（Search Intent）に基づいているか

その分析結果を踏まえ、既存の記事よりも網羅的で、読者にとって価値の高い独自のブログ記事構成案を生成してください。
構成案は、明確な導入部、複数の主要セクション（それぞれに具体的なサブ項目を含む）、そして力強い結論部からなる論理的な構造を持つ必要があります。

最終的なアウトプットは、必ず以下のJSON形式に従ってください。説明や前置きは一切不要です。JSONオブジェクトのみを出力してください。

JSON形式の例:
\`\`\`json
${jsonSchemaString}
\`\`\`
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
        temperature: 0.5,
      },
    });

    const jsonText = response.text.trim();
    // AIの応答がマークダウンのコードブロックで囲まれている場合を考慮して抽出
    const jsonMatch = jsonText.match(/```json\n([\s\S]*?)\n```/);
    const parsableText = jsonMatch ? jsonMatch[1] : jsonText;

    const parsedData: OutlineData = JSON.parse(parsableText);
    return parsedData;

  } catch (error) {
    console.error("Error generating outline:", error);
    if (error instanceof Error) {
        if (error.name === 'SyntaxError') {
             throw new Error(`AIからの応答をJSONとして解析できませんでした。AIの応答が不正な形式である可能性があります。`);
        }
        throw new Error(`構成案の生成中にエラーが発生しました: ${error.message}`);
    }
    throw new Error("構成案の生成中に不明なエラーが発生しました。");
  }
}
