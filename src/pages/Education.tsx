import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlayCircle, BookOpen, Puzzle, Star, Award } from 'lucide-react'
import { useGamification } from '@/context/GamificationContext'
import { Button } from '@/components/ui/button'

const educationalContent = [
  {
    type: 'video',
    title: 'A Super Aventura da Limpeza dos Alinhadores',
    icon: PlayCircle,
    color: 'bg-blue-400',
    img: 'https://img.usecurling.com/p/400/200?q=animated%20tooth%20brushing',
    reward: 20,
  },
  {
    type: 'article',
    title: 'O que os Super-Heróis do Sorriso Comem?',
    icon: BookOpen,
    color: 'bg-green-400',
    img: 'https://img.usecurling.com/p/400/200?q=healthy%20food%20for%20teeth',
    reward: 15,
  },
  {
    type: 'quiz',
    title: 'Quiz: Você é um Mestre dos Alinhadores?',
    icon: Puzzle,
    color: 'bg-yellow-400',
    img: 'https://img.usecurling.com/p/400/200?q=question%20mark%20blocks',
    reward: 30,
  },
  {
    type: 'video',
    title: 'Como Usar Seu Alinhador Corretamente',
    icon: PlayCircle,
    color: 'bg-purple-400',
    img: 'https://img.usecurling.com/p/400/200?q=dental%20aligner%20instruction',
    reward: 20,
  },
  {
    type: 'article',
    title: 'Dicas para Dormir com Alinhadores',
    icon: BookOpen,
    color: 'bg-indigo-400',
    img: 'https://img.usecurling.com/p/400/200?q=sleeping%20with%20smile',
    reward: 15,
  },
  {
    type: 'quiz',
    title: 'Desafio dos Dentes Saudáveis',
    icon: Puzzle,
    color: 'bg-pink-400',
    img: 'https://img.usecurling.com/p/400/200?q=healthy%20teeth%20quiz',
    reward: 25,
  },
]

const Education = () => {
  const { addCoins, addXP, completeMission } = useGamification()

  const handleContentClick = (reward: number) => {
    addCoins(reward)
    addXP(reward / 2)
    completeMission('learn-something')
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col items-center text-center">
        <img
          src="https://img.usecurling.com/p/150/150?q=wise%20owl%20teacher%20mascot"
          alt="Mascote Coruja"
          className="mb-4 animate-float hover-wiggle"
        />
        <h1 className="font-display text-4xl font-extrabold text-primary">
          Escola de Heróis do Sorriso
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Aprenda tudo para ter o sorriso mais poderoso de todos!
        </p>
      </div>

      <Card className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-500 animate-wiggle-slow" />
              <div>
                <p className="text-lg font-bold">Ganhe Recompensas!</p>
                <p className="text-sm text-muted-foreground">
                  Complete conteúdos educacionais e ganhe moedas
                </p>
              </div>
            </div>
            <Award className="h-12 w-12 text-orange-500 animate-bounce-slow" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {educationalContent.map((item) => (
          <Card
            key={item.title}
            className="group cursor-pointer overflow-hidden transition-all duration-300 hover-scale hover:shadow-xl"
            onClick={() => handleContentClick(item.reward)}
          >
            <CardHeader className="p-0">
              <div className="relative overflow-hidden">
                <img
                  src={item.img}
                  alt={item.title}
                  className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div
                  className={`absolute bottom-2 right-2 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform duration-300 group-hover:scale-125 ${item.color}`}
                >
                  <item.icon className="h-8 w-8 text-white" />
                </div>
                <div className="absolute top-2 left-2 rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-yellow-900 shadow-md">
                  +{item.reward} moedas
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <h3 className="text-lg font-bold group-hover:text-primary-child transition-colors">
                {item.title}
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full hover-bounce"
              >
                {item.type === 'video' && 'Assistir Vídeo'}
                {item.type === 'article' && 'Ler Artigo'}
                {item.type === 'quiz' && 'Fazer Quiz'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Education
