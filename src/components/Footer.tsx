import { Link } from 'react-router-dom'

export const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-2 py-4 px-4 text-sm text-muted-foreground sm:flex-row">
        <p>
          &copy; {currentYear} Clínica [Nome da Clínica]. Todos os direitos
          reservados.
        </p>
        <div className="flex gap-4">
          <Link to="/terms" className="hover:text-primary hover:underline">
            Termos de Uso
          </Link>
          <Link to="/privacy" className="hover:text-primary hover:underline">
            Política de Privacidade
          </Link>
        </div>
      </div>
    </footer>
  )
}
