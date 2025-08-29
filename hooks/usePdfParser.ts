
import { useState, useCallback } from 'react';

// pdfjs-dist is loaded from CDN in index.html, so we declare the global variable
declare const pdfjsLib: any;

const usePdfParser = () => {
  const [text, setText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const parsePdf = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setText('');

    try {
      if (typeof pdfjsLib === 'undefined') {
        throw new Error('pdf.js library is not loaded. Please check the script tag in index.html.');
      }
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      const fileReader = new FileReader();
      fileReader.onload = async (event) => {
        if (!event.target?.result) {
            setError("Failed to read file.");
            setIsLoading(false);
            return;
        }

        try {
            const typedarray = new Uint8Array(event.target.result as ArrayBuffer);
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            let fullText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += pageText + '\n\n';
            }
            
            setText(fullText);
        } catch(e: any) {
             setError(e.message || "An unknown error occurred during PDF processing.");
        } finally {
            setIsLoading(false);
        }
      };
      
      fileReader.onerror = () => {
          setError("Error reading the file.");
          setIsLoading(false);
      }
      
      fileReader.readAsArrayBuffer(file);

    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  }, []);

  return { parsePdf, text, isLoading, error };
};

export default usePdfParser;
