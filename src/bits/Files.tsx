import React from 'react'

type FilesProps = {
  files: string[];
};

function Files({ files }: FilesProps) {
  return (
    <div className="col-start-2 flex items-center justify-around text-dark-tile h-[calc(.25*var(--tile-size))]">
      {files.map((file) => (
        <span key={file}>{file}</span>
      ))}
    </div>
  );
}

export default Files