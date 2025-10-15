import React, { useState, useRef, useCallback } from 'react';
import type { ImageFile, CompressionLevel, GeneratedImage } from './types';
import { generatePdfFromImages } from './services/pdfGenerator';
import { extractImagesFromPdf, createZipFromImages } from './services/pdfExtractor';
import UploadCloudIcon from './components/icons/UploadCloudIcon';
import FileImageIcon from './components/icons/FileImageIcon';
import FilePdfIcon from './components/icons/FilePdfIcon';
import XIcon from './components/icons/XIcon';
import Spinner from './components/Spinner';

type Mode = 'imageToPdf' | 'pdfToImage';

// Header Component
const Header: React.FC<{ mode: Mode }> = ({ mode }) => (
    <header className="bg-white dark:bg-slate-800 shadow-md">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center space-x-3">
                 {mode === 'imageToPdf' ? (
                    <FileImageIcon className="h-8 w-8 text-indigo-500" />
                ) : (
                    <FilePdfIcon className="h-8 w-8 text-indigo-500" />
                )}
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                    {mode === 'imageToPdf' ? 'Conversor de Imagens para PDF' : 'Extrator de Imagens de PDF'}
                </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {mode === 'imageToPdf'
                    ? 'Selecione imagens, reordene-as e crie um único arquivo PDF instantaneamente.'
                    : 'Envie um arquivo PDF para extrair todas as páginas como imagens individuais.'
                }
            </p>
        </div>
    </header>
);

// ImageUploader Component
const ImageUploader: React.FC<{ onFilesSelected: (files: FileList) => void; }> = ({ onFilesSelected }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            onFilesSelected(e.target.files);
            e.target.value = '';
        }
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation();
        e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50');
        if (e.dataTransfer.files?.length) { onFilesSelected(e.dataTransfer.files); e.dataTransfer.clearData(); }
    };
    const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, addClass: boolean) => {
        e.preventDefault(); e.stopPropagation();
        e.currentTarget.classList.toggle('border-indigo-500', addClass);
        e.currentTarget.classList.toggle('bg-indigo-50', addClass);
    };

    return (
        <div 
            className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 transition-colors duration-300"
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => handleDragEvents(e, true)} onDragLeave={(e) => handleDragEvents(e, false)}
        >
            <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
            <UploadCloudIcon className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-slate-600 dark:text-slate-300"><span className="font-semibold text-indigo-500">Clique para enviar</span> ou arraste e solte</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">PNG, JPG, GIF de até 10MB</p>
        </div>
    );
};

// ImagePreviewGrid Component
const ImagePreviewGrid: React.FC<{ images: ImageFile[]; onRemove: (id: string) => void; onReorder: (dragIndex: number, hoverIndex: number) => void; }> = ({ images, onRemove, onReorder }) => {
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => { dragItem.current = index; e.dataTransfer.effectAllowed = 'move'; };
    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        if (dragItem.current !== null && dragOverItem.current !== null) { onReorder(dragItem.current, dragOverItem.current); }
        dragItem.current = null; dragOverItem.current = null;
        (e.currentTarget.parentNode as HTMLElement)?.childNodes.forEach(node => (node as HTMLElement).classList.remove('scale-105'));
    };

    if (images.length === 0) return null;

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {images.map((image, index) => (
                <div key={image.id} className="relative group aspect-square rounded-lg shadow-lg overflow-hidden transition-transform duration-300 ease-in-out" draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnter={() => dragOverItem.current = index} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()}
                >
                    <img src={image.previewUrl} alt={image.file.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
                        <button onClick={() => onRemove(image.id)} className="absolute top-2 right-2 p-1 bg-white/70 dark:bg-slate-800/70 rounded-full text-slate-800 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white" aria-label="Remover imagem"><XIcon className="w-4 h-4" /></button>
                        <div className="text-white text-center p-2 opacity-0 group-hover:opacity-100 transition-opacity"><p className="text-xs font-semibold break-all truncate">{image.file.name}</p></div>
                    </div>
                </div>
            ))}
        </div>
    );
};


// PDF Uploader Component
const PdfUploader: React.FC<{ onFileSelected: (file: File) => void, selectedFile: File | null }> = ({ onFileSelected, selectedFile }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) { onFileSelected(e.target.files[0]); e.target.value = '';}
    };

    return (
        <div>
            <div 
                className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 transition-colors duration-300"
                onClick={() => inputRef.current?.click()}
            >
                <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                <FilePdfIcon className="mx-auto h-12 w-12 text-slate-400" />
                <p className="mt-4 text-slate-600 dark:text-slate-300"><span className="font-semibold text-indigo-500">Clique para selecionar um PDF</span></p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Selecione um arquivo PDF para extrair as imagens.</p>
            </div>
            {selectedFile && (
                <div className="mt-4 text-center p-3 bg-slate-200 dark:bg-slate-700 rounded-md">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Arquivo selecionado: <span className="font-bold">{selectedFile.name}</span></p>
                </div>
            )}
        </div>
    );
};

// Extracted Images Grid Component
const ExtractedImagesGrid: React.FC<{ images: GeneratedImage[] }> = ({ images }) => {
    const downloadImage = (dataUrl: string, filename: string) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (images.length === 0) return null;
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {images.map((image) => (
                <div key={image.id} className="relative group aspect-[7/10] rounded-lg shadow-lg overflow-hidden">
                    <img src={image.dataUrl} alt={image.filename} className="w-full h-full object-contain bg-white" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex flex-col items-center justify-center p-2">
                        <button onClick={() => downloadImage(image.dataUrl, image.filename)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity">
                            Baixar
                        </button>
                        <p className="text-white text-xs font-semibold break-all truncate mt-2 opacity-0 group-hover:opacity-100 transition-opacity">{image.filename}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Main App Component
const App: React.FC = () => {
    const [mode, setMode] = useState<Mode>('pdfToImage');
    
    // State for Image to PDF
    const [images, setImages] = useState<ImageFile[]>([]);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [genProgress, setGenProgress] = useState<number>(0);
    const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('MEDIUM');

    // State for PDF to Image
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [isExtracting, setIsExtracting] = useState<boolean>(false);
    const [extractProgress, setExtractProgress] = useState<number>(0);

    const handleFilesSelected = (files: FileList) => {
        const newImages: ImageFile[] = Array.from(files).filter(file => file.type.startsWith('image/')).map(file => ({
            id: `${file.name}-${file.lastModified}-${Math.random()}`, file, previewUrl: URL.createObjectURL(file),
        }));
        setImages(prev => [...prev, ...newImages]);
    };
    const handleRemoveImage = (id: string) => {
        setImages(prev => prev.filter(image => {
            if (image.id === id) { URL.revokeObjectURL(image.previewUrl); return false; } return true;
        }));
    };
    const handleClearAll = () => { images.forEach(image => URL.revokeObjectURL(image.previewUrl)); setImages([]); };
    const handleGeneratePdf = async () => {
        if (images.length === 0) return;
        setIsGenerating(true); setGenProgress(0);
        await generatePdfFromImages(images, compressionLevel, setGenProgress);
        setIsGenerating(false);
    };
    const handleReorder = useCallback((dragIndex: number, hoverIndex: number) => {
        setImages(prev => { const newImages = [...prev]; const [draggedItem] = newImages.splice(dragIndex, 1); newImages.splice(hoverIndex, 0, draggedItem); return newImages; });
    }, []);

    const handlePdfSelected = (file: File) => { setPdfFile(file); setGeneratedImages([]); };
    const handleExtractImages = async () => {
        if (!pdfFile) return;
        setIsExtracting(true); setExtractProgress(0); setGeneratedImages([]);
        const extracted = await extractImagesFromPdf(pdfFile, setExtractProgress);
        setGeneratedImages(extracted);
        setIsExtracting(false);
    };
    const handleDownloadAllAsZip = async () => {
        if (generatedImages.length === 0 || !pdfFile) return;
        await createZipFromImages(generatedImages, pdfFile.name);
    };
    const handleClearPdf = () => { setPdfFile(null); setGeneratedImages([]); };

    const TABS: { id: Mode; label: string }[] = [{ id: 'pdfToImage', label: 'PDF para Imagem' }, { id: 'imageToPdf', label: 'Imagem para PDF' }];

    return (
        <div className="min-h-screen flex flex-col">
            <Header mode={mode} />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 border-b border-slate-300 dark:border-slate-700">
                    <nav className="-mb-px flex justify-center space-x-6" aria-label="Tabs">
                        {TABS.map(tab => (
                            <button key={tab.id} onClick={() => setMode(tab.id)}
                                className={`${mode === tab.id ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-500'} 
                                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none`}
                                aria-current={mode === tab.id ? 'page' : undefined}>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                {mode === 'imageToPdf' && (
                    <div className="space-y-8">
                        <ImageUploader onFilesSelected={handleFilesSelected} />
                        <ImagePreviewGrid images={images} onRemove={handleRemoveImage} onReorder={handleReorder} />
                    </div>
                )}
                {mode === 'pdfToImage' && (
                    <div className="space-y-8">
                        <PdfUploader onFileSelected={handlePdfSelected} selectedFile={pdfFile} />
                        {pdfFile && !isExtracting && (
                             <div className="flex justify-center items-center gap-4">
                                <button onClick={handleExtractImages} className="inline-flex justify-center items-center px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                    <FilePdfIcon className="w-5 h-5 mr-2"/>Extrair Imagens
                                </button>
                                <button onClick={handleClearPdf} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-transparent rounded-md hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 focus:outline-none">
                                    Limpar
                                </button>
                            </div>
                        )}
                        {generatedImages.length > 0 && (
                            <div className="flex justify-center">
                                <button onClick={handleDownloadAllAsZip} className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                    Baixar Todas as Imagens (ZIP)
                                </button>
                            </div>
                        )}
                        <ExtractedImagesGrid images={generatedImages} />
                    </div>
                )}
            </main>

            {(isGenerating || isExtracting) && (
                 <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex flex-col items-center justify-center z-50">
                    <Spinner className="w-12 h-12 text-white" />
                    <p className="text-white text-lg mt-4">{isGenerating ? 'Gerando PDF...' : 'Extraindo Imagens...'}</p>
                    <div className="w-64 bg-slate-600 rounded-full h-2.5 mt-2">
                        <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${isGenerating ? genProgress : extractProgress}%` }}></div>
                    </div>
                    <p className="text-white text-sm mt-1">{isGenerating ? genProgress : extractProgress}%</p>
                </div>
            )}

            {mode === 'imageToPdf' && images.length > 0 && !isGenerating && (
                <footer className="sticky bottom-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border-t border-slate-200 dark:border-slate-700">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            <span className="font-bold">{images.length}</span> {images.length !== 1 ? 'imagens selecionadas' : 'imagem selecionada'}. Arraste para reordenar.
                        </p>
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="flex items-center gap-2">
                                <label htmlFor="compression-select" className="text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">Qualidade do PDF:</label>
                                <select id="compression-select" name="compression" value={compressionLevel} onChange={(e) => setCompressionLevel(e.target.value as CompressionLevel)}
                                    className="block w-full pl-3 pr-8 py-2 text-sm border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-indigo-500 transition" aria-label="Qualidade do PDF e Nível de Compressão">
                                    <option value="FAST">Melhor Qualidade (Arquivo maior)</option>
                                    <option value="MEDIUM">Equilibrado</option>
                                    <option value="SLOW">Menor Arquivo (Qualidade inferior)</option>
                                </select>
                            </div>
                            <button onClick={handleClearAll} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-transparent rounded-md hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">Limpar Tudo</button>
                            <button onClick={handleGeneratePdf} disabled={isGenerating} className="inline-flex justify-center items-center px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed">
                                {isGenerating ? <Spinner className="w-5 h-5 mr-2"/> : <FileImageIcon className="w-5 h-5 mr-2"/>}
                                {isGenerating ? 'Gerando...' : 'Gerar PDF'}
                            </button>
                        </div>
                    </div>
                </footer>
            )}
        </div>
    );
};

export default App;