import React, { useState, useCallback, FormEvent, useEffect, useRef } from 'react';
import { generateOutline } from './services/geminiService';
import { OutlineData, OutlineSection } from './types';

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
  </svg>
);

const LoadingIndicator: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col justify-center items-center p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mb-4"></div>
        <p className="text-slate-400 text-lg animate-pulse">{message}</p>
    </div>
);


const OutlineDisplay: React.FC<{ data: OutlineData }> = ({ data }) => (
  <div className="bg-slate-800 rounded-xl shadow-lg p-6 md:p-8 mt-8 w-full animate-fade-in">
    <h2 className="text-2xl md:text-3xl font-bold text-sky-400 mb-6 border-b-2 border-slate-700 pb-4">{data.title}</h2>
    <div className="space-y-6">
      {data.outline.map((item: OutlineSection, index: number) => (
        <div key={index} className="pl-4 border-l-4 border-slate-600">
          <h3 className="text-xl font-semibold text-slate-100">{item.section}</h3>
          <ul className="list-disc list-inside mt-3 space-y-2 text-slate-300">
            {item.subsections.map((subsection: string, subIndex: number) => (
              <li key={subIndex} className="ml-4">{subsection}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </div>
);


const App: React.FC = () => {
  const [topic, setTopic] = useState<string>('');
  const [outline, setOutline] = useState<OutlineData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const intervalRef = useRef<number | null>(null);

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!topic.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setOutline(null);

    const messages = [
      "上位記事の検索を開始します...",
      "競合コンテンツのH2, H3を分析中...",
      "最適な構成案を生成しています...",
      "最終チェックを行っています..."
    ];
    let messageIndex = 0;
    setLoadingMessage(messages[messageIndex]);

    intervalRef.current = window.setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      if (messageIndex < messages.length -1) { // Stop at the last message
          setLoadingMessage(messages[messageIndex]);
      }
    }, 3500);

    try {
      const result = await generateOutline(topic);
      setOutline(result);
    } catch (err) {
      if (err instanceof Error) {
          setError(err.message);
      } else {
          setError('不明なエラーが発生しました。');
      }
    } finally {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [topic, isLoading]);
  
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
        
        <header className="text-center my-8 md:my-12">
          <div className="inline-block bg-sky-500/10 p-3 rounded-full mb-4">
             <SparklesIcon className="w-8 h-8 text-sky-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
            AI 構成案ジェネレーター
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            タイトルやキーワードを入力するだけで、SEOに強い構成案を瞬時に作成します。
          </p>
        </header>

        <main className="w-full">
          <form onSubmit={handleSubmit} className="relative w-full">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例: 「効果的なリモートワークのコツ」"
              className="w-full p-4 pr-32 bg-slate-800 border-2 border-slate-700 rounded-full text-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !topic.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center bg-sky-500 text-white font-bold py-2 px-6 rounded-full h-12 hover:bg-sky-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  <span>生成</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 w-full">
            {isLoading && <LoadingIndicator message={loadingMessage} />}
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg text-center">
                <p><strong>エラー:</strong> {error}</p>
              </div>
            )}
            {outline && <OutlineDisplay data={outline} />}
            {!isLoading && !error && !outline && (
                <div className="text-center text-slate-500 mt-16 p-6 border-2 border-dashed border-slate-700 rounded-xl">
                    <p>ここに生成された構成案が表示されます。</p>
                </div>
            )}
          </div>
        </main>
        
        <footer className="text-center mt-12 mb-6">
            <p className="text-sm text-slate-600">Powered by Google Gemini</p>
        </footer>

      </div>
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
