/**
 * PageHeader Component
 * Cabeçalho padronizado para páginas com imagem + título + subtítulo
 */

interface PageHeaderProps {
  title: string
  subtitle?: string
  imageUrl?: string
  imageAlt?: string
}

export function PageHeader({
  title,
  subtitle,
  imageUrl = '/heroisdosorriso.png',
  imageAlt = 'Heróis do Sorriso',
}: PageHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <img
        src={imageUrl}
        alt={imageAlt}
        className="mb-4 animate-float hover-wiggle max-w-full h-auto"
      />
      <h1 className="font-display text-2xl md:text-4xl font-extrabold text-primary break-words">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-base md:text-lg text-muted-foreground break-words">
          {subtitle}
        </p>
      )}
    </div>
  )
}
