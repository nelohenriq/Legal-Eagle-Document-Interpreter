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

  const dropzoneClass = `relative flex flex-col items-center justify-center w-full max-w-xl mx-auto p-12 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-300 ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-600 hover:bg-slate-100 dark:hover:bg-slate-900'}`;
  
  return (
    <div className="text-center w-full">
        <h2 className="text-3xl font-bold mb-2">Comece por Analisar um Documento</h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">Carregue um ficheiro PDF para o analisar, estruturar e começar a fazer perguntas.</p>
        <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={dropzoneClass}
        >
            <input type="file" id="pdf-upload" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf" onChange={handleFileChange} />
            <div className="flex flex-col items-center justify-center pointer-events-none">
                <UploadCloudIcon className="h-12 w-12 text-slate-400 dark:text-slate-500 mb-4" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                    <span className="text-blue-600 dark:text-blue-500">Clique para carregar</span> ou arraste e largue
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Apenas PDF (máx. 10MB)</p>
            </div>
        </div>
    </div>
  );
};

export default FileUpload;