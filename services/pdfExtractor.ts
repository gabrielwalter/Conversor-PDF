import type { GeneratedImage } from '../types';

declare global {
    interface Window {
        pdfjsLib: any;
        JSZip: any;
    }
}

const initializePdfJs = () => {
    if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    }
};

initializePdfJs();

export const extractImagesFromPdf = async (
    pdfFile: File,
    setProgress: (progress: number) => void
): Promise<GeneratedImage[]> => {
    if (!window.pdfjsLib) {
        alert("A biblioteca PDF.js não foi carregada. Por favor, verifique sua conexão com a internet e tente novamente.");
        return [];
    }

    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const extractedImages: GeneratedImage[] = [];

    const baseFilename = pdfFile.name.replace(/\.pdf$/i, '');

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        // Usar uma escala maior para melhor qualidade de imagem
        const scale = 2.0;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };

            await page.render(renderContext).promise;

            extractedImages.push({
                id: `${pdfFile.name}-page-${i}`,
                dataUrl: canvas.toDataURL('image/png'),
                filename: `${baseFilename}-pagina-${String(i).padStart(3, '0')}.png`,
            });
        }
        
        setProgress(Math.round((i / numPages) * 100));
    }

    return extractedImages;
};

export const createZipFromImages = async (
    images: GeneratedImage[],
    pdfFileName: string
): Promise<void> => {
     if (!window.JSZip) {
        alert("A biblioteca JSZip não foi carregada. Por favor, verifique sua conexão com a internet e tente novamente.");
        return;
    }
    const zip = new window.JSZip();
    
    images.forEach(image => {
        // Extrai os dados base64 da URL de dados
        const base64Data = image.dataUrl.split(',')[1];
        zip.file(image.filename, base64Data, { base64: true });
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = `${pdfFileName.replace(/\.pdf$/i, '')}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};
