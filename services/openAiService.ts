import { OutlineData } from '../types';

// This function calls our own backend, which then calls OpenAI
export const generateOutline = async (topic: string): Promise<OutlineData> => {
  // A more robust prompt asking for JSON output
  const prompt = `以下のトピックに関するブログ記事の構成案を生成してください。
トピック: ${topic}
出力は必ず以下のJSON形式の文字列のみで返してください。他のテキストは含めないでください。
{
  "title": "記事のタイトル",
  "outline": [
    {
      "section": "セクション1のタイトル",
      "subsections": ["サブセクション1.1", "サブセクション1.2"]
    },
    {
      "section": "セクション2のタイトル",
      "subsections": ["サブセクション2.1", "サブセクション2.2"]
    }
  ]
}`;

  const response = await fetch('/api/openai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt,
      model: 'gpt-5', // The backend will validate this
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.details || 'OpenAI APIからの応答エラー');
  }

  const data = await response.json();
  const content = data.content;

  try {
    // The content from the LLM is expected to be a JSON string.
    return JSON.parse(content);
  } catch (e) {
    console.error("Failed to parse JSON response from OpenAI:", content);
    throw new Error("OpenAIからの応答を解析できませんでした。");
  }
};

export const generateArticleSection = async (
  articleTitle: string,
  sectionTitle: string,
  subsections: string[]
): Promise<string> => {
    const prompt = `以下のブログ記事のセクション本文を執筆してください。

記事タイトル: ${articleTitle}
執筆するセクション: ${sectionTitle}
このセクションに含めるべきサブセクションやキーワード: ${subsections.join(', ')}

上記の指示に基づいて、セクションの本文を日本語で生成してください。余計な前置きや後書きは不要です。本文のみを出力してください。`;

    const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt: prompt,
            model: 'gpt-5',
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'OpenAI APIからの応答エラー');
    }

    const data = await response.json();
    return data.content;
};
