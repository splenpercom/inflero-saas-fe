type ProductImageProps = {
  image?: string | null;
  className?: string;
};

/** Renders a product thumbnail (URL or emoji placeholder). */
export function ProductImage({ image, className }: ProductImageProps) {
  const isUrl = image?.startsWith("http") || image?.startsWith("/");

  return (
    <div
      className={
        className ??
        "w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-sm border border-gray-300 dark:border-gray-700 overflow-hidden shrink-0"
      }
    >
      {isUrl ? (
        <img src={image!} alt="" className="w-full h-full object-cover" />
      ) : (
        image || "📦"
      )}
    </div>
  );
}
