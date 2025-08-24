import { OutlineData } from '../types';

// This function calls our own backend, which then calls OpenAI (non-streaming)
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
      model: 'gpt-5',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.details || 'OpenAI APIからの応答エラー');
  }

  const data = await response.json();
  const content = data.content;

  try {
    return JSON.parse(content);
  } catch (e) {
    console.error("Failed to parse JSON response from OpenAI:", content);
    throw new Error("OpenAIからの応答を解析できませんでした。");
  }
};

// This function handles the streaming response for article generation
export const generateArticleSectionStream = async (
  articleTitle: string,
  sectionTitle: string,
  subsections: string[],
  onChunk: (chunk: string) => void
): Promise<void> => {
    const prompt = `以下のブログ記事のセクション本文を執筆してください。

記事タイトル: ${articleTitle}
執筆するセクション: ${sectionTitle}
このセクションに含めるべきサブセクションやキーワード: ${subsections.join(', ')}

上記の指示に基づいて、セクションの本文を日本語で生成してください。余計な前置きや後書きは不要です。本文のみを出力してください。`;

    const response = await fetch('/api/openai-stream', {
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
        const errorText = await response.text();
        throw new Error(errorText || 'OpenAIストリーミングAPIからの応答エラー');
    }

    if (!response.body) {
        throw new Error("ストリーミング応答のボディがありません。");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        const chunk = decoder.decode(value, { stream: true });
        onChunk(chunk);
    }
};
