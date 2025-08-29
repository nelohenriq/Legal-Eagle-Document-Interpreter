import React, { useState, useCallback } from 'react';
import { UploadCloudIcon } from './Icons';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (e.target.files[0].type === 'application/pdf') {
        onFileSelect(e.target.files[0]);
      } else {
        alert("Please select a PDF file.");
      }
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
       if (e.dataTransfer.files[0].type === 'application/pdf') {
        onFileSelect(e.dataTransfer.files[0]);
      } else {
        alert("Please select a PDF file.");
      }
    }
  }, [onFileSelect]);

  const dropzoneClass = `flex flex-col items-center justify-center w-full max-w-lg mx-auto p-12 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-300 ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`;
  
  return (
    <div className="text-center py-8 border-t border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold mb-2">Ou Analise um Novo Documento</h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">Carregue um novo ficheiro PDF para o analisar, estruturar e guardar na sua biblioteca.</p>
        <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={dropzoneClass}
        >
            <input type="file" id="pdf-upload" className="hidden" accept=".pdf" onChange={handleFileChange} />
            <label htmlFor="pdf-upload" className="flex flex-col items-center justify-center cursor-pointer">
                <UploadCloudIcon className="h-12 w-12 text-slate-400 dark:text-slate-500 mb-4" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                    <span className="text-blue-600 dark:text-blue-500">Clique para carregar</span> ou arraste e largue
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Apenas PDF (máx. 10MB)</p>
            </label>
        </div>
    </div>
  );
};

export default FileUpload;
