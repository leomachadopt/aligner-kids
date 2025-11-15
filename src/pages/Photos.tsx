import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, Upload, Wand2 } from 'lucide-react'

const photoExamples = [
  {
    title: 'Sorriso Frontal',
    img: 'https://img.usecurling.com/p/200/200?q=child%20frontal%20smile%20teeth',
  },
  {
    title: 'Lado Direito',
    img: 'https://img.usecurling.com/p/200/200?q=child%20right%20smile%20teeth',
  },
  {
    title: 'Lado Esquerdo',
    img: 'https://img.usecurling.com/p/200/200?q=child%20left%20smile%20teeth',
  },
]

const Photos = () => {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col items-center text-center">
        <img
          src="https://img.usecurling.com/p/150/150?q=camera%20mascot"
          alt="Mascote Câmera"
          className="mb-4"
        />
        <h1 className="font-display text-4xl font-extrabold text-primary">
          Estúdio de Fotos Mágicas
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Vamos registrar a evolução do seu super sorriso!
        </p>
      </div>

      <Card className="text-center shadow-lg">
        <CardHeader>
          <CardTitle>Hora da Foto!</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p>
            Peça ajuda a um adulto e siga os exemplos abaixo para tirar as
            melhores fotos.
          </p>
          <Button size="lg" className="gap-2">
            <Camera className="h-6 w-6" />
            Abrir Câmera
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {photoExamples.map((photo) => (
          <Card key={photo.title}>
            <CardHeader>
              <CardTitle>{photo.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={photo.img}
                alt={photo.title}
                className="w-full rounded-lg border-2 border-dashed"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sua Galeria de Sorrisos</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="group relative">
              <img
                src={`https://img.usecurling.com/p/200/200?q=child%20smile%20${i}`}
                alt={`Foto ${i}`}
                className="w-full rounded-lg"
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="font-bold text-white">01/0{i}/2025</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default Photos
