import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlayCircle, BookOpen, Puzzle } from 'lucide-react'

const educationalContent = [
  {
    type: 'video',
    title: 'A Super Aventura da Limpeza dos Alinhadores',
    icon: PlayCircle,
    color: 'bg-blue-400',
    img: 'https://img.usecurling.com/p/400/200?q=animated%20tooth%20brushing',
  },
  {
    type: 'article',
    title: 'O que os Super-Heróis do Sorriso Comem?',
    icon: BookOpen,
    color: 'bg-green-400',
    img: 'https://img.usecurling.com/p/400/200?q=healthy%20food%20for%20teeth',
  },
  {
    type: 'quiz',
    title: 'Quiz: Você é um Mestre dos Alinhadores?',
    icon: Puzzle,
    color: 'bg-yellow-400',
    img: 'https://img.usecurling.com/p/400/200?q=question%20mark%20blocks',
  },
]

const Education = () => {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col items-center text-center">
        <img
          src="https://img.usecurling.com/p/150/150?q=wise%20owl%20teacher%20mascot"
          alt="Mascote Coruja"
          className="mb-4"
        />
        <h1 className="font-display text-4xl font-extrabold text-primary">
          Escola de Heróis do Sorriso
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Aprenda tudo para ter o sorriso mais poderoso de todos!
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {educationalContent.map((item) => (
          <Card
            key={item.title}
            className="group cursor-pointer overflow-hidden transition-transform hover:scale-105"
          >
            <CardHeader className="p-0">
              <div className="relative">
                <img
                  src={item.img}
                  alt={item.title}
                  className="h-40 w-full object-cover"
                />
                <div
                  className={`absolute bottom-2 right-2 flex h-12 w-12 items-center justify-center rounded-full ${item.color}`}
                >
                  <item.icon className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <h3 className="text-lg font-bold">{item.title}</h3>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Education
