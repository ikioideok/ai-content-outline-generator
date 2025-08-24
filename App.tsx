import React, { useState, useCallback, FormEvent, useEffect, useRef } from 'react';
import * as geminiService from './services/geminiService';
import * as openAiService from './services/openAiService';
import { getSavedOutlines, saveOutlines, getSavedArticles, saveArticles, getSavedMarkdowns, saveMarkdowns } from './services/storageService';
import { OutlineData, OutlineSection, SavedOutline, SavedArticle, ArticleContentPart, SavedMarkdown } from './types';

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

const OutlineEditor: React.FC<{
  data: OutlineData;
  setData: React.Dispatch<React.SetStateAction<OutlineData | null>>;
}> = ({ data, setData }) => {

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData(prev => prev ? { ...prev, title: e.target.value } : null);
  };

  const handleSectionChange = (index: number, value: string) => {
    setData(prev => {
      if (!prev) return null;
      const newOutline = [...prev.outline];
      newOutline[index] = { ...newOutline[index], section: value };
      return { ...prev, outline: newOutline };
    });
  };

  const handleSubsectionsChange = (index: number, value: string) => {
    setData(prev => {
      if (!prev) return null;
      const newOutline = [...prev.outline];
      newOutline[index] = { ...newOutline[index], subsections: value.split('\n') };
      return { ...prev, outline: newOutline };
    });
  };

  return (
    <div className="bg-slate-800 rounded-xl shadow-lg p-6 md:p-8 mt-8 w-full animate-fade-in space-y-6">
      <div>
        <label htmlFor="main-title" className="block text-sm font-medium text-sky-400 mb-1">タイトル</label>
        <input
          id="main-title"
          type="text"
          value={data.title}
          onChange={handleTitleChange}
          className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-2xl font-bold text-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
      {data.outline.map((item, index) => (
        <div key={index} className="pl-4 border-l-4 border-slate-600 space-y-3">
          <div>
            <label htmlFor={`section-title-${index}`} className="block text-sm font-medium text-slate-100 mb-1">セクション</label>
            <input
              id={`section-title-${index}`}
              type="text"
              value={item.section}
              onChange={(e) => handleSectionChange(index, e.target.value)}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-xl font-semibold text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div>
            <label htmlFor={`subsections-${index}`} className="block text-sm font-medium text-slate-300 mb-1">サブセクション（改行で区切る）</label>
            <textarea
              id={`subsections-${index}`}
              value={item.subsections.join('\n')}
              onChange={(e) => handleSubsectionsChange(index, e.target.value)}
              rows={item.subsections.length + 1}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const MarkdownEditor: React.FC<{
  markdown: string;
  onMarkdownChange: (newMarkdown: string) => void;
  onSave: () => void;
  isEditing: boolean;
}> = ({ markdown, onMarkdownChange, onSave, isEditing }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="bg-slate-800/50 rounded-xl shadow-lg w-full relative flex flex-col h-[70vh]">
      <div className="flex justify-between items-center p-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-slate-200">マークダウン・エディタ</h3>
        <div className="flex items-center gap-4">
          <button
            onClick={handleCopy}
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2 px-4 rounded-md text-sm transition-colors"
          >
            {isCopied ? 'コピーしました！' : 'コピー'}
          </button>
          <button
            onClick={onSave}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors"
          >
            {isEditing ? '更新' : '保存'}
          </button>
        </div>
      </div>
      <textarea
        value={markdown}
        onChange={(e) => onMarkdownChange(e.target.value)}
        className="flex-grow p-4 bg-transparent text-slate-300 whitespace-pre-wrap break-words text-sm focus:outline-none w-full h-full resize-none"
      />
    </div>
  );
};

const ArticleEditor: React.FC<{
  outline: OutlineData;
  article: Map<string, string>;
  onContentChange: (sectionTitle: string, newContent: string) => void;
  onSave: () => void;
  onGenerateMarkdown: () => void;
  editingArticleId: string | null;
}> = ({ outline, article, onContentChange, onSave, onGenerateMarkdown, editingArticleId }) => {
  return (
    <div className="bg-slate-800/50 rounded-xl shadow-lg w-full">
      <div className="p-6 md:p-8">
        <h2 className="text-3xl font-bold text-sky-400 mb-6 border-b-2 border-slate-700 pb-4">{outline.title}</h2>
        <div className="space-y-8">
          {outline.outline.map((section, index) => (
            <div key={index}>
              <h3 className="text-2xl font-semibold text-slate-100 mb-3">{section.section}</h3>
              <textarea
                value={article.get(section.section) || ''}
                onChange={(e) => onContentChange(section.section, e.target.value)}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 min-h-[150px] text-base"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-slate-900/50 p-4 rounded-b-xl flex justify-end items-center gap-4">
         <button
          onClick={onGenerateMarkdown}
          className="flex items-center justify-center bg-blue-600 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-700 transition-colors"
        >
          マークダウン出力
        </button>
        <button
          onClick={onSave}
          className="flex items-center justify-center bg-green-600 text-white font-bold py-2 px-6 rounded-full hover:bg-green-700 transition-colors"
        >
          {editingArticleId ? '記事を更新' : '記事を保存'}
        </button>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [topic, setTopic] = useState<string>('');
  const [outline, setOutline] = useState<OutlineData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const intervalRef = useRef<number | null>(null);
  const [savedOutlines, setSavedOutlines] = useState<SavedOutline[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [markdownOutput, setMarkdownOutput] = useState<string>('');
  const [isGeneratingArticle, setIsGeneratingArticle] = useState<boolean>(false);
  const [currentGeneratingSection, setCurrentGeneratingSection] = useState<string>('');
  const [generatedArticle, setGeneratedArticle] = useState<Map<string, string>>(new Map());
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [savedMarkdowns, setSavedMarkdowns] = useState<SavedMarkdown[]>([]);
  const [editingMarkdownId, setEditingMarkdownId] = useState<string | null>(null);
  const [isPowerUpMode, setIsPowerUpMode] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<'gemini' | 'openai'>('gemini');

  useEffect(() => {
    setSavedOutlines(getSavedOutlines());
    setSavedArticles(getSavedArticles());
    setSavedMarkdowns(getSavedMarkdowns());
  }, []);

  const handleResetApp = () => {
    setTopic('');
    setOutline(null);
    setIsLoading(false);
    setError(null);
    setLoadingMessage('');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setEditingId(null);
    setMarkdownOutput('');
    setIsGeneratingArticle(false);
    setCurrentGeneratingSection('');
    setGeneratedArticle(new Map());
    setEditingArticleId(null);
    setEditingMarkdownId(null);
  };

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!topic.trim() || isLoading) return;

    setEditingId(null);
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
      let result;
      if (isPowerUpMode && selectedModel === 'openai') {
        result = await openAiService.generateOutline(topic);
      } else {
        result = await geminiService.generateOutline(topic);
      }
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

  const handleSaveOrUpdate = () => {
    if (!outline) return;

    let updatedOutlines;
    if (editingId) {
      // Update existing
      updatedOutlines = savedOutlines.map(o =>
        o.id === editingId ? { ...outline, id: editingId, createdAt: o.createdAt } : o
      );
    } else {
      // Save new
      const newSavedOutline: SavedOutline = {
        ...outline,
        id: Date.now().toString(),
        createdAt: Date.now(),
      };
      updatedOutlines = [newSavedOutline, ...savedOutlines];
    }

    setSavedOutlines(updatedOutlines);
    saveOutlines(updatedOutlines);
    setEditingId(null);
    setOutline(null);
    setTopic('');
  };

  const handleEdit = (id: string) => {
    const outlineToEdit = savedOutlines.find(o => o.id === id);
    if (outlineToEdit) {
      setOutline(outlineToEdit);
      setTopic(outlineToEdit.title); // Or some other relevant topic source
      setEditingId(id);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('本当にこの構成案を削除しますか？')) {
      const updatedOutlines = savedOutlines.filter(o => o.id !== id);
      setSavedOutlines(updatedOutlines);
      saveOutlines(updatedOutlines);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setOutline(null);
    setTopic('');
    setMarkdownOutput('');
  };

  const generateMarkdown = (data: OutlineData): string => {
    let md = `# ${data.title}\n\n`;
    data.outline.forEach(item => {
      md += `## ${item.section}\n\n`;
      item.subsections.forEach(subsection => {
        md += `- ${subsection}\n`;
      });
      md += '\n';
    });
    return md;
  };

  const handleGenerateMarkdown = () => {
    if (!outline) return;
    const md = generateMarkdown(outline);
    setMarkdownOutput(md);
  };

  const handleMarkdownChange = (newMarkdown: string) => {
    setMarkdownOutput(newMarkdown);
  };

  const handleGenerateArticleMarkdown = () => {
    if (!outline || generatedArticle.size === 0) return;
    const md = generateArticleMarkdown(outline, generatedArticle);
    setMarkdownOutput(md);
    setGeneratedArticle(new Map()); // Clear the editor view
    setOutline(null);
    setEditingArticleId(null);
  };

  const generateArticleMarkdown = (
    outline: OutlineData,
    article: Map<string, string>
  ): string => {
    let md = `# ${outline.title}\n\n`;
    outline.outline.forEach(item => {
      md += `## ${item.section}\n\n`;
      md += (article.get(item.section) || '') + '\n\n';
    });
    return md;
  };

  const handleArticleContentChange = (sectionTitle: string, newContent: string) => {
    setGeneratedArticle(prev => new Map(prev).set(sectionTitle, newContent));
  };

  const handleGenerateArticle = async () => {
    if (!outline) return;

    setIsGeneratingArticle(true);
    setMarkdownOutput('');
    setGeneratedArticle(new Map());
    setError(null);

    try {
      for (const section of outline.outline) {
        setCurrentGeneratingSection(section.section);

        if (isPowerUpMode && selectedModel === 'openai') {
            const onChunk = (chunk: string) => {
                setGeneratedArticle(prev => {
                    const currentContent = prev.get(section.section) || '';
                    const newContent = currentContent + chunk;
                    return new Map(prev).set(section.section, newContent);
                });
            };
            await openAiService.generateArticleSectionStream(
                outline.title,
                section.section,
                section.subsections,
                onChunk
            );
        } else {
            const sectionText = await geminiService.generateArticleSection(
                outline.title,
                section.section,
                section.subsections
            );
            setGeneratedArticle(prev => new Map(prev).set(section.section, sectionText));
        }
      }
    } catch (err) {
       if (err instanceof Error) {
          setError(err.message);
      } else {
          setError('記事の生成中に不明なエラーが発生しました。');
      }
    } finally {
      setIsGeneratingArticle(false);
      setCurrentGeneratingSection('');
    }
  };

  const handleSaveOrUpdateArticle = () => {
    if (!outline || generatedArticle.size === 0) return;

    const content: ArticleContentPart[] = Array.from(generatedArticle.entries()).map(
      ([section, content]) => ({ section, content })
    );

    let updatedArticles;
    if (editingArticleId) {
      // Update
      updatedArticles = savedArticles.map(a =>
        a.id === editingArticleId
          ? { ...a, outline: outline, content: content }
          : a
      );
    } else {
      // Save new
      const newArticle: SavedArticle = {
        id: Date.now().toString(),
        createdAt: Date.now(),
        outline: outline,
        content: content,
      };
      updatedArticles = [newArticle, ...savedArticles];
    }

    setSavedArticles(updatedArticles);
    saveArticles(updatedArticles);

    // Reset state
    setEditingArticleId(null);
    setGeneratedArticle(new Map());
    setOutline(null);
    setTopic('');
  };

  const handleEditArticle = (id: string) => {
    const articleToEdit = savedArticles.find(a => a.id === id);
    if (articleToEdit) {
      setOutline(articleToEdit.outline);
      const articleMap = new Map(
        articleToEdit.content.map(part => [part.section, part.content])
      );
      setGeneratedArticle(articleMap);
      setEditingArticleId(articleToEdit.id);
      setEditingId(null); // Clear outline editing state
      setMarkdownOutput('');
    }
  };

  const handleDeleteArticle = (id: string) => {
    if (window.confirm('本当にこの記事を削除しますか？')) {
      const updatedArticles = savedArticles.filter(a => a.id !== id);
      setSavedArticles(updatedArticles);
      saveArticles(updatedArticles);
    }
  };

  const handleSaveOrUpdateMarkdown = () => {
    if (!markdownOutput.trim()) return;

    // Extract title from the first line of markdown
    const firstLine = markdownOutput.trim().split('\n')[0] || '無題のマークダウン';
    const title = firstLine.replace(/^#+\s*/, '');

    let updatedMarkdowns;
    if (editingMarkdownId) {
      // Update
      updatedMarkdowns = savedMarkdowns.map(md =>
        md.id === editingMarkdownId
          ? { ...md, title: title, content: markdownOutput }
          : md
      );
    } else {
      // Save new
      const newMarkdown: SavedMarkdown = {
        id: Date.now().toString(),
        createdAt: Date.now(),
        title: title,
        content: markdownOutput,
      };
      updatedMarkdowns = [newMarkdown, ...savedMarkdowns];
    }

    setSavedMarkdowns(updatedMarkdowns);
    saveMarkdowns(updatedMarkdowns);

    // Reset state
    setEditingMarkdownId(null);
    setMarkdownOutput('');
  };

  const handleEditMarkdown = (id: string) => {
    const markdownToEdit = savedMarkdowns.find(md => md.id === id);
    if (markdownToEdit) {
      setMarkdownOutput(markdownToEdit.content);
      setEditingMarkdownId(id);
      // Clear other views
      setOutline(null);
      setGeneratedArticle(new Map());
      setEditingId(null);
      setEditingArticleId(null);
    }
  };

  const handleDeleteMarkdown = (id: string) => {
    if (window.confirm('本当にこのマークダウンを削除しますか？')) {
      const updatedMarkdowns = savedMarkdowns.filter(md => md.id !== id);
      setSavedMarkdowns(updatedMarkdowns);
      saveMarkdowns(updatedMarkdowns);
    }
  };

  return (
    <div className={`min-h-screen ${isPowerUpMode ? 'bg-indigo-900' : 'bg-slate-900'} text-white flex flex-col items-center p-4 sm:p-6 font-sans transition-colors duration-500`}>
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
        
        <header className="text-center my-8 md:my-12">
          <div className="inline-block bg-sky-500/10 p-3 rounded-full mb-4">
             <SparklesIcon className="w-8 h-8 text-sky-400" />
          </div>
          <h1
            onClick={handleResetApp}
            className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300 cursor-pointer transition-opacity hover:opacity-80">
            AI記事制作ツール
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            {isPowerUpMode
              ? '新機能を搭載したパワーアップ版です。'
              : 'タイトルやキーワードを入力するだけで、SEOに強い構成案を瞬時に作成します。'}
          </p>
          <div className="mt-6 flex justify-center items-center">
            <span className={`mr-3 text-sm font-medium ${!isPowerUpMode ? 'text-white' : 'text-slate-400'}`}>通常版</span>
            <label htmlFor="powerUpToggle" className="inline-flex relative items-center cursor-pointer">
              <input
                type="checkbox"
                id="powerUpToggle"
                className="sr-only peer"
                checked={isPowerUpMode}
                onChange={() => setIsPowerUpMode(!isPowerUpMode)}
              />
              <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-focus:ring-4 peer-focus:ring-sky-800 peer-checked:bg-sky-600"></div>
              <div className="absolute top-0.5 left-[2px] bg-white border-gray-300 border rounded-full h-5 w-5 transition-all peer-checked:translate-x-full peer-checked:border-white"></div>
            </label>
            <span className={`ml-3 text-sm font-medium ${isPowerUpMode ? 'text-sky-400' : 'text-slate-400'}`}>パワーアップ版</span>
          </div>
          {isPowerUpMode && (
            <div className="mt-4">
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  onClick={() => setSelectedModel('gemini')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-lg border transition-colors ${selectedModel === 'gemini' ? 'bg-sky-600 border-sky-600 text-white' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}
                >
                  Gemini
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedModel('openai')}
                  className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-b border-r transition-colors ${selectedModel === 'openai' ? 'bg-sky-600 border-sky-600 text-white' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}
                >
                  ChatGPT (gpt-5)
                </button>
              </div>
            </div>
          )}
        </header>

        <main className="w-full">
          <div className="flex flex-col md:flex-row gap-8 lg:gap-12">

            {/* Left Column */}
            <div className="flex-1 md:w-3/5">
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
            {outline && (
              <>
                <OutlineEditor data={outline} setData={setOutline} />
                <div className="flex items-center justify-end gap-4 mt-6">
                  {editingId && (
                     <button
                        onClick={handleCancelEdit}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        キャンセル
                      </button>
                  )}
                   <button
                    onClick={handleGenerateMarkdown}
                    disabled={isGeneratingArticle}
                    className="flex items-center justify-center bg-blue-600 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-700 transition-colors disabled:bg-slate-600"
                  >
                    マークダウン出力
                  </button>
                   <button
                    onClick={handleGenerateArticle}
                    disabled={isGeneratingArticle}
                    className="flex items-center justify-center bg-purple-600 text-white font-bold py-2 px-6 rounded-full hover:bg-purple-700 transition-colors disabled:bg-slate-600"
                  >
                    記事を生成
                  </button>
                  <button
                    onClick={handleSaveOrUpdate}
                    disabled={isGeneratingArticle}
                    className="flex items-center justify-center bg-green-600 text-white font-bold py-2 px-6 rounded-full hover:bg-green-700 transition-colors disabled:bg-slate-600"
                  >
                    {editingId ? '更新を保存' : 'リストに保存'}
                  </button>
                </div>
                {isGeneratingArticle && (
                   <div className="mt-4 text-center text-purple-400 animate-pulse">
                     <p>記事を生成中... (現在: {currentGeneratingSection})</p>
                   </div>
                )}
              </>
            )}
            {!isLoading && !error && !outline && (
                <div className="text-center text-slate-500 mt-16 p-6 border-2 border-dashed border-slate-700 rounded-xl">
                    <p>ここに生成された構成案が表示されます。</p>
                </div>
            )}
          </div>

          {savedOutlines.length > 0 && !editingId && (
            <section className="w-full mt-16">
              <h2 className="text-2xl font-bold text-slate-300 mb-6 text-center">保存済み構成案</h2>
              <div className="space-y-4">
                {savedOutlines.map((saved) => (
                  <div key={saved.id} className="bg-slate-800/50 rounded-lg p-4 flex justify-between items-center transition-all hover:bg-slate-800">
                    <span className="text-slate-200 font-medium">{saved.title}</span>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleEdit(saved.id)}
                        className="text-sky-400 hover:text-sky-300 font-semibold"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(saved.id)}
                        className="text-red-400 hover:text-red-300 font-semibold"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {savedArticles.length > 0 && !generatedArticle.size && (
            <section className="w-full mt-12">
              <h2 className="text-2xl font-bold text-slate-300 mb-6 text-center">保存済み記事</h2>
              <div className="space-y-4">
                {savedArticles.map((saved) => (
                  <div key={saved.id} className="bg-slate-800/50 rounded-lg p-4 flex justify-between items-center transition-all hover:bg-slate-800">
                    <span className="text-slate-200 font-medium">{saved.outline.title}</span>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleEditArticle(saved.id)}
                        className="text-sky-400 hover:text-sky-300 font-semibold"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeleteArticle(saved.id)}
                        className="text-red-400 hover:text-red-300 font-semibold"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {savedMarkdowns.length > 0 && !markdownOutput && !generatedArticle.size && (
            <section className="w-full mt-12">
              <h2 className="text-2xl font-bold text-slate-300 mb-6 text-center">保存済みマークダウン</h2>
              <div className="space-y-4">
                {savedMarkdowns.map((saved) => (
                  <div key={saved.id} className="bg-slate-800/50 rounded-lg p-4 flex justify-between items-center transition-all hover:bg-slate-800">
                    <span className="text-slate-200 font-medium">{saved.title}</span>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleEditMarkdown(saved.id)}
                        className="text-sky-400 hover:text-sky-300 font-semibold"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeleteMarkdown(saved.id)}
                        className="text-red-400 hover:text-red-300 font-semibold"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
            </div>

            {/* Right Column (Markdown Output) */}
            <div className="flex-1 md:w-2/5">
              <div className="sticky top-6">
                {generatedArticle.size > 0 && outline ? (
                  <ArticleEditor
                    outline={outline}
                    article={generatedArticle}
                    onContentChange={handleArticleContentChange}
                    onSave={handleSaveOrUpdateArticle}
                    onGenerateMarkdown={handleGenerateArticleMarkdown}
                    editingArticleId={editingArticleId}
                  />
                ) : markdownOutput ? (
                  <MarkdownEditor
                    markdown={markdownOutput}
                    onMarkdownChange={handleMarkdownChange}
                    onSave={handleSaveOrUpdateMarkdown}
                    isEditing={!!editingMarkdownId}
                  />
                ) : (
                  <div className="text-center text-slate-500 mt-16 p-6 border-2 border-dashed border-slate-700 rounded-xl">
                      <p>ここにマークダウンや生成された記事が表示されます。</p>
                  </div>
                )}
              </div>
            </div>

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
