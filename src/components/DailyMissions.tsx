import { useGamification } from '@/context/GamificationContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, Camera, BookOpen, Clock, Star, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'

const MISSION_ICONS = {
  usage: Clock,
  photo: Camera,
  education: BookOpen,
  checkin: Star,
}

export const DailyMissions = () => {
  const { dailyMissions, completeMission } = useGamification()

  const completedCount = dailyMissions.filter((m) => m.completed).length
  const totalMissions = dailyMissions.length

  return (
    <Card className="border-2 border-primary-child">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-display text-2xl">
            <Star className="h-6 w-6 text-yellow-500" />
            Missões de Hoje
          </CardTitle>
          <div className="rounded-full bg-primary-child px-3 py-1">
            <span className="font-bold text-white">
              {completedCount}/{totalMissions}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {dailyMissions.map((mission) => {
          const Icon = MISSION_ICONS[mission.type]
          return (
            <div
              key={mission.id}
              className={cn(
                'group rounded-lg border-2 p-4 transition-all duration-300 hover-scale',
                mission.completed
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 bg-white hover:border-primary-child',
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={cn(
                      'mt-1 rounded-full p-2',
                      mission.completed ? 'bg-green-400' : 'bg-primary-child/20',
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        mission.completed ? 'text-green-800' : 'text-primary-child',
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <h4
                      className={cn(
                        'font-semibold',
                        mission.completed && 'line-through text-gray-500',
                      )}
                    >
                      {mission.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">{mission.description}</p>
                    <div className="mt-2 flex items-center gap-1">
                      <Coins className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-bold text-yellow-700">
                        +{mission.reward} moedas
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  {mission.completed ? (
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => completeMission(mission.id)}
                      className="hover-bounce"
                    >
                      <Circle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {completedCount === totalMissions && (
          <div className="mt-4 rounded-lg bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 p-4 text-center animate-bounce-slow">
            <p className="font-display text-xl font-extrabold text-white drop-shadow-lg">
              🎉 Todas as missões completadas! 🎉
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
