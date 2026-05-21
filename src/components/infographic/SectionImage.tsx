type SectionImageProps = {
  src?: string;
  alt: string;
  radius: string;
  heightClass?: string;
};

export function SectionImage({
  src,
  alt,
  radius,
  heightClass = "h-40",
}: SectionImageProps) {
  if (!src) return null;
  return (
    <div className="mb-5 overflow-hidden" style={{ borderRadius: radius }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        crossOrigin="anonymous"
        className={`w-full ${heightClass} object-cover`}
      />
    </div>
  );
}
