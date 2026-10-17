interface QuestionImageProps {
  src?: string;
  className?: string;
  alt?: string;
}

export default function QuestionImage({ src, className = '', alt = 'Gambar soal' }: QuestionImageProps) {
  if (!src) return null;
  return (
    <div className={`my-4 flex justify-center ${className}`}>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-80 object-contain rounded-lg border border-slate-200 bg-white shadow-sm"
        loading="lazy"
      />
    </div>
  );
}
