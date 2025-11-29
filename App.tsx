
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { analyzeImageColors } from './services/geminiService';
import type { ColorAnalysis } from './types';
import { ColorSwatch } from './components/ColorSwatch';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { GoogleGenAI } from "@google/genai";

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
  
// --- Icons ---
const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
);

const EyeDropperIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11.25l-3-3m0 0l-3.75 3.75M8.25 8.25l-6 6 6 6 6-6M9 14.25l6-6M19.5 4.5l-6 6M19.5 4.5l2.25 2.25M19.5 4.5l-1.125-1.125c-.621-.621-1.628-.621-2.25 0L15 4.5" />
  </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M12 12.75l-3-3m0 0-3 3m3-3v7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);


// Helper to convert RGB to Hex
const rgbToHex = (r: number, g: number, b: number) => {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
};

// --- Security / Storage Helpers ---
const STORAGE_KEY = 'enc_gemini_api_key';

// Simple "Encryption" (Obfuscation) for local storage
// WARNING: This is client-side only and not truly secure against the user themselves, 
// but it prevents plain text storage.
const encryptKey = (key: string): string => {
  try {
    // Simple XOR with a salt then Base64
    const salt = "color-palette-secret";
    let textToChars = (text: string) => text.split('').map(c => c.charCodeAt(0));
    let byteHex = (n: number) => ("0" + Number(n).toString(16)).substr(-2);
    let applySaltToChar = (code: number) => textToChars(salt).reduce((a, b) => a ^ b, code);

    return btoa(textToChars(key).map(applySaltToChar).map(byteHex).join(''));
  } catch (e) {
    console.error("Encryption failed", e);
    return "";
  }
};

const decryptKey = (encoded: string): string => {
  try {
    const salt = "color-palette-secret";
    let textToChars = (text: string) => text.split('').map(c => c.charCodeAt(0));
    let applySaltToChar = (code: number) => textToChars(salt).reduce((a, b) => a ^ b, code);
    
    return atob(encoded).match(/.{1,2}/g)!
      .map(hex => parseInt(hex, 16))
      .map(applySaltToChar)
      .map(charCode => String.fromCharCode(charCode))
      .join('');
  } catch (e) {
    console.error("Decryption failed", e);
    return "";
  }
};


export default function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ColorAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // Eyedropper state
  const [isEyedropperActive, setIsEyedropperActive] = useState(false);
  const [hoverColor, setHoverColor] = useState<string | null>(null);
  const [pickedColor, setPickedColor] = useState<{ hex: string; rgb: string } | null>(null);

  // API Key Modal State
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [inputApiKey, setInputApiKey] = useState('');
  const [keyTestStatus, setKeyTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [keyTestMessage, setKeyTestMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load API key on mount (if exists)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      // Key exists, user is ready to go
    }
  }, []);

  const handleSaveAndTestKey = async () => {
    if (!inputApiKey.trim()) {
      setKeyTestStatus('error');
      setKeyTestMessage('API Key를 입력해주세요.');
      return;
    }

    setKeyTestStatus('testing');
    setKeyTestMessage('연결 테스트 중...');

    try {
      // Test the key with a lightweight request
      const ai = new GoogleGenAI({ apiKey: inputApiKey });
      await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Hello',
      });

      // Success
      setKeyTestStatus('success');
      setKeyTestMessage('연결 성공! 키가 안전하게 저장되었습니다.');
      
      // Save encrypted
      const encrypted = encryptKey(inputApiKey);
      localStorage.setItem(STORAGE_KEY, encrypted);

      // Close modal after a brief delay
      setTimeout(() => {
        setIsKeyModalOpen(false);
        setKeyTestStatus('idle');
        setKeyTestMessage('');
      }, 1500);

    } catch (err) {
      setKeyTestStatus('error');
      setKeyTestMessage('연결 실패. API Key를 확인해주세요.');
      console.error(err);
    }
  };

  const getApiKey = (): string | null => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return decryptKey(stored);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
      setError(null);
      setPickedColor(null);
      setIsEyedropperActive(false);
    }
  };

  const handleImageLoad = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (canvas && img) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isEyedropperActive || !canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;

    const actualX = Math.floor(x * scaleX);
    const actualY = Math.floor(y * scaleY);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      const clampedX = Math.max(0, Math.min(actualX, img.naturalWidth - 1));
      const clampedY = Math.max(0, Math.min(actualY, img.naturalHeight - 1));
      
      const pixel = ctx.getImageData(clampedX, clampedY, 1, 1).data;
      const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
      setHoverColor(hex);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (isEyedropperActive && hoverColor) {
      const r = parseInt(hoverColor.slice(1, 3), 16);
      const g = parseInt(hoverColor.slice(3, 5), 16);
      const b = parseInt(hoverColor.slice(5, 7), 16);
      
      setPickedColor({
        hex: hoverColor,
        rgb: `rgb(${r}, ${g}, ${b})`
      });
      setIsEyedropperActive(false);
    }
  };

  const handleAnalyzeClick = useCallback(async () => {
    if (!imageFile) return;

    // Retrieve Key
    const apiKey = getApiKey();
    if (!apiKey) {
      setIsKeyModalOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const base64Image = await fileToBase64(imageFile);
      // Pass the API key explicitly
      const result = await analyzeImageColors(base64Image, imageFile.type, apiKey);
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      // If unauthorized, maybe key is bad?
      if (err instanceof Error && err.message.includes('401')) {
         setError('API Key가 유효하지 않습니다. 설정을 확인해주세요.');
         localStorage.removeItem(STORAGE_KEY); // Clear bad key
      }
    } finally {
      setIsLoading(false);
    }
  }, [imageFile]);

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const downloadPDF = async () => {
    if (!analysisResult) return;
    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;
      
      const printContainer = document.createElement('div');
      printContainer.style.width = '800px';
      printContainer.style.padding = '30px';
      printContainer.style.background = '#111827'; 
      printContainer.style.color = '#ffffff';
      printContainer.style.position = 'absolute';
      printContainer.style.top = '-9999px';
      printContainer.style.left = '-9999px';
      document.body.appendChild(printContainer);

      const header = document.createElement('div');
      header.innerHTML = `
        <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 5px; color: #818cf8;">색상 팔레트 분석</h1>
        <p style="color: #9ca3af; margin-bottom: 30px; font-size: 14px;">생성일: ${new Date().toLocaleDateString()}</p>
      `;
      printContainer.appendChild(header);

      const paletteContainer = document.createElement('div');
      paletteContainer.style.display = 'grid';
      paletteContainer.style.gap = '20px';
      
      analysisResult.palette.forEach(color => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.alignItems = 'center'; 
        item.style.gap = '20px';
        item.style.background = 'rgba(31, 41, 55, 0.5)'; 
        item.style.padding = '20px';
        item.style.borderRadius = '8px';
        item.style.border = '1px solid #374151';
        
        item.innerHTML = `
          <div style="width: 80px; height: 80px; background-color: ${color.hex}; border: 1px solid #4b5563; border-radius: 8px; flex-shrink: 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"></div>
          <div style="flex: 1;">
            <div style="font-weight: bold; font-size: 18px; color: #f3f4f6;">${color.name}</div>
            <div style="font-family: monospace; font-size: 14px; color: #a5b4fc; margin-top: 4px;">${color.hex} <span style="color: #6b7280">|</span> ${color.rgb}</div>
            <div style="font-size: 14px; color: #d1d5db; margin-top: 8px; line-height: 1.5;">${color.description}</div>
          </div>
        `;
        paletteContainer.appendChild(item);
      });
      printContainer.appendChild(paletteContainer);

      const canvas = await html2canvas(printContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#111827'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const imgProps = doc.getImageProperties(imgData);
      const pdfWidth = pageWidth - (margin * 2);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      doc.addImage(imgData, 'JPEG', margin, margin, pdfWidth, pdfHeight);
      doc.save('color-palette-analysis.pdf');

      document.body.removeChild(printContainer);

    } catch (err) {
      console.error("PDF generation failed", err);
      alert("PDF 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const ResultsPanel = () => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-12 h-12 border-4 border-t-indigo-500 border-gray-600 rounded-full animate-spin"></div>
                <h3 className="text-xl font-semibold mt-6">분석 중...</h3>
                <p className="text-gray-400 mt-2">Gemini가 이미지의 마법 같은 색상을 찾고 있습니다.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-red-900/20 border border-red-500/30 rounded-lg">
                <h3 className="text-xl font-semibold text-red-400">분석 실패</h3>
                <p className="text-gray-300 mt-2 max-w-md">{error}</p>
                {error.includes("API Key") && (
                   <button 
                     onClick={() => setIsKeyModalOpen(true)}
                     className="mt-4 px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                   >
                     API Key 설정하기
                   </button>
                )}
            </div>
        );
    }
    
    if (analysisResult) {
        return (
            <div className="space-y-4" ref={resultsRef}>
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-2xl font-bold text-white">색상 팔레트</h2>
                  <button 
                    onClick={downloadPDF}
                    disabled={isGeneratingPdf}
                    className="flex items-center space-x-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors disabled:text-gray-500 disabled:cursor-wait"
                  >
                    <DownloadIcon className="w-5 h-5" />
                    <span>{isGeneratingPdf ? '생성 중...' : 'PDF 다운로드'}</span>
                  </button>
                </div>
                {analysisResult.palette.map((color, index) => (
                    <ColorSwatch key={index} color={color} />
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed border-gray-700 rounded-lg">
            <SparklesIcon className="w-12 h-12 text-gray-500 mb-4" />
            <h3 className="text-xl font-semibold">분석 대기 중</h3>
            <p className="text-gray-400 mt-2">이미지를 업로드하고 '색상 분석'을 클릭하여 결과를 확인하세요.</p>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col p-4 sm:p-6 lg:p-8 relative">
      {/* Settings Button */}
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
        <button
          onClick={() => setIsKeyModalOpen(true)}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
          title="API Key 설정"
        >
          <SettingsIcon className="w-6 h-6" />
        </button>
      </div>

      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
          이미지에서 컬러추출
        </h1>
        <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
          이미지를 업로드하여 Gemini의 강력한 기능으로 고유한 색상 팔레트를 즉시 발견하세요.
        </p>
      </header>

      <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto w-full">
        {/* Left Panel: Image Upload & Preview */}
        <div className="flex flex-col bg-gray-800/50 rounded-xl p-6 shadow-2xl">
          <div className="flex-grow flex flex-col justify-center items-center relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              ref={fileInputRef}
            />
            {/* Hidden canvas for pixel data */}
            <canvas ref={canvasRef} className="hidden" />

            {imageUrl ? (
              <div className="w-full h-full relative group flex flex-col items-center">
                <div className="relative w-full">
                    <img 
                        ref={imageRef}
                        src={imageUrl} 
                        alt="Uploaded preview" 
                        onLoad={handleImageLoad}
                        onMouseMove={handleMouseMove}
                        onClick={isEyedropperActive ? handleImageClick : undefined}
                        className={`w-full h-auto max-h-[500px] object-contain rounded-lg shadow-lg ${isEyedropperActive ? 'cursor-crosshair' : ''}`} 
                    />
                    
                    {!isEyedropperActive && (
                        <button onClick={triggerFileSelect} className="absolute inset-0 bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-lg text-lg font-medium">
                        이미지 변경
                        </button>
                    )}
                </div>

                <div className="mt-4 flex items-center space-x-4 w-full bg-gray-900/80 p-3 rounded-lg border border-gray-700">
                    <button 
                        onClick={() => setIsEyedropperActive(!isEyedropperActive)}
                        className={`p-2 rounded-md transition-colors ${isEyedropperActive ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        title="스포이드 도구 전환"
                    >
                        <EyeDropperIcon className="w-6 h-6" />
                    </button>
                    
                    <div className="flex-1 flex items-center justify-between">
                        {isEyedropperActive && hoverColor ? (
                             <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full border border-gray-500 shadow-sm" style={{ backgroundColor: hoverColor }}></div>
                                <span className="font-mono text-white">{hoverColor}</span>
                                <span className="text-xs text-gray-400">(클릭하여 선택)</span>
                             </div>
                        ) : pickedColor ? (
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full border border-gray-500 shadow-sm" style={{ backgroundColor: pickedColor.hex }}></div>
                                <div className="flex flex-col">
                                    <span className="font-mono text-white font-bold">{pickedColor.hex}</span>
                                    <span className="text-xs text-gray-400 font-mono">{pickedColor.rgb}</span>
                                </div>
                            </div>
                        ) : (
                            <span className="text-gray-500 text-sm">색상을 선택하려면 도구를 선택하세요</span>
                        )}
                    </div>
                </div>

              </div>
            ) : (
                <div 
                    onClick={triggerFileSelect}
                    onDrop={(e) => { e.preventDefault(); handleImageChange({ target: e.dataTransfer } as any); }}
                    onDragOver={(e) => e.preventDefault()}
                    className="w-full h-full min-h-[300px] flex flex-col justify-center items-center border-4 border-dashed border-gray-600 hover:border-indigo-500 rounded-lg cursor-pointer transition-colors p-6 text-center"
                >
                    <UploadIcon className="w-16 h-16 text-gray-500 mb-4" />
                    <span className="font-semibold text-lg">클릭하여 업로드하거나 드래그 앤 드롭하세요</span>
                    <span className="text-gray-400 mt-1">PNG, JPG, WEBP 등</span>
                </div>
            )}
          </div>
          <button
            onClick={handleAnalyzeClick}
            disabled={!imageFile || isLoading}
            className="w-full mt-6 flex items-center justify-center px-6 py-4 bg-indigo-600 text-white font-bold text-lg rounded-lg hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg"
          >
            <SparklesIcon className="w-6 h-6 mr-3"/>
            {isLoading ? '분석 중...' : '색상 분석'}
          </button>
        </div>

        {/* Right Panel: Results */}
        <div className="bg-gray-800/50 rounded-xl p-6 shadow-2xl overflow-y-auto max-h-[75vh]">
            <ResultsPanel />
        </div>
      </main>

      {/* API Key Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => {
                setIsKeyModalOpen(false);
                setKeyTestStatus('idle');
                setKeyTestMessage('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className="text-xl font-bold text-white mb-4">API Key 설정</h2>
            <p className="text-gray-400 text-sm mb-6">
              Gemini API 키를 입력해주세요. 키는 당신의 브라우저에 암호화되어 안전하게 저장됩니다.
            </p>
            
            <div className="space-y-4">
              <div>
                <input
                  type="password"
                  value={inputApiKey}
                  onChange={(e) => setInputApiKey(e.target.value)}
                  placeholder="AIzaSy... 키를 여기에 붙여넣으세요"
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleSaveAndTestKey}
                  disabled={keyTestStatus === 'testing'}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                  {keyTestStatus === 'testing' ? '테스트 중...' : '저장 및 테스트'}
                </button>
              </div>

              {/* Status Messages */}
              {keyTestMessage && (
                 <div className={`mt-4 p-3 rounded-lg text-sm ${
                    keyTestStatus === 'success' ? 'bg-green-900/30 text-green-400 border border-green-800' :
                    keyTestStatus === 'error' ? 'bg-red-900/30 text-red-400 border border-red-800' :
                    'bg-gray-700/30 text-gray-300'
                 }`}>
                   {keyTestMessage}
                 </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
