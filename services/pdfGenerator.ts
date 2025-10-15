import type { ImageFile, CompressionLevel } from '../types';

declare global {
    interface Window {
        jspdf: any;
    }
}

// Mapeia os níveis de compressão descritivos para valores numéricos de qualidade JPEG para o canvas.
const getJpegQuality = (compression: CompressionLevel): number => {
    switch (compression) {
        case 'FAST': // Corresponde a "Melhor Qualidade"
            return 0.95;
        case 'MEDIUM': // Corresponde a "Equilibrado"
            return 0.75;
        case 'SLOW': // Corresponde a "Menor Arquivo"
            return 0.5;
        default:
            return 0.75; // Padrão para equilibrado
    }
};

export const generatePdfFromImages = async (
    images: ImageFile[],
    compression: CompressionLevel,
    setProgress: (progress: number) => void
): Promise<void> => {
    if (!window.jspdf) {
        alert("A biblioteca jsPDF não foi carregada. Por favor, verifique sua conexão com a internet e tente novamente.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageMargin = 10;
    const contentWidth = pageWidth - pageMargin * 2;
    const contentHeight = pageHeight - pageMargin * 2;

    for (let i = 0; i < images.length; i++) {
        const imageFile = images[i];
        if (i > 0) {
            doc.addPage();
        }

        const img = new Image();
        img.src = imageFile.previewUrl;

        await new Promise(resolve => {
            img.onload = resolve;
        });

        // --- Início da correção ---
        // Cria um canvas para processar a imagem. Este passo é crucial
        // para lidar com imagens com transparência (como PNGs) e aplicar
        // uma compressão JPEG consistente.
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Falha ao obter o contexto do canvas');
            // Como fallback, tenta o método original para esta imagem
            try {
                doc.addImage(img, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, compression);
            } catch (e) {
                doc.addImage(img, 'PNG', 0, 0, pageWidth, pageHeight);
            }
            continue;
        }

        // Preenche o fundo com branco para remover a transparência
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Desenha a imagem original no canvas
        ctx.drawImage(img, 0, 0);

        // Obtém os dados da imagem como uma URL de dados JPEG com a qualidade selecionada pelo usuário
        const jpegQuality = getJpegQuality(compression);
        const imageDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
        // --- Fim da correção ---

        const imgRatio = img.width / img.height;
        const contentRatio = contentWidth / contentHeight;
        let finalWidth, finalHeight;

        if (imgRatio > contentRatio) {
            finalWidth = contentWidth;
            finalHeight = finalWidth / imgRatio;
        } else {
            finalHeight = contentHeight;
            finalWidth = finalHeight * imgRatio;
        }

        const x = (pageWidth - finalWidth) / 2;
        const y = (pageHeight - finalHeight) / 2;

        // Adiciona a URL de dados da imagem processada ao PDF.
        // A compressão já está aplicada na URL de dados.
        doc.addImage(imageDataUrl, 'JPEG', x, y, finalWidth, finalHeight);

        setProgress(Math.round(((i + 1) / images.length) * 100));
    }

    doc.save('converted-images.pdf');
};