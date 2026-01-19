import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlayCircle, Star, Award, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/context/AuthContext'
import { EducationService, type EducationLesson } from '@/services/educationService'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

const Education = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const patientId = user?.id

  const [lessons, setLessons] = useState<EducationLesson[]>([])
  const [selected, setSelected] = useState<EducationLesson | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    if (!patientId) return
    const res = await EducationService.listLessons(patientId)
    setLessons(res.lessons || [])
  }

  useEffect(() => {
    load().catch(() => {
      // ignore
    })
  }, [patientId])

  const openLesson = (l: EducationLesson) => {
    setSelected(l)
    setAnswers(new Array((l.quiz || []).length).fill(-1))
  }

  const canSubmit = useMemo(() => {
    if (!selected) return false
    return (selected.quiz || []).length > 0 && answers.every((a) => a >= 0)
  }, [selected, answers])

  const submit = async () => {
    if (!patientId || !selected) return
    setSubmitting(true)
    try {
      const res = await EducationService.submitQuiz(patientId, selected.id, answers)
      if (res.passed) {
        toast.success(t('patient.education.quiz.successMessage', { score: res.scorePercent }))
      } else {
        toast.error(t('patient.education.quiz.failMessage', { score: res.scorePercent }))
      }
      setSelected(null)
      await load()
    } catch (e: any) {
      toast.error(e?.message || t('patient.education.quiz.submitError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col items-center text-center">
        <img
          src="/heroisdosorriso.png"
          alt="Heróis do Sorriso"
          className="mb-4 animate-float hover-wiggle"
        />
        <h1 className="font-display text-4xl font-extrabold text-primary">
          {t('patient.education.title')}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t('patient.education.subtitle')}
        </p>
      </div>

      <Card className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-500 animate-wiggle-slow" />
              <div>
                <p className="text-lg font-bold">{t('patient.education.earnRewards.title')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('patient.education.earnRewards.description')}
                </p>
              </div>
            </div>
            <Award className="h-12 w-12 text-orange-500 animate-bounce-slow" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {lessons.map((item) => (
          <Card
            key={item.title}
            className="group cursor-pointer overflow-hidden transition-all duration-300 hover-scale hover:shadow-xl"
            onClick={() => openLesson(item)}
          >
            <CardHeader className="p-0">
              <div className="relative overflow-hidden">
                <img
                  src="https://img.usecurling.com/p/400/200?q=kids%20dental%20education%20cartoon"
                  alt={item.title}
                  className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div
                  className="absolute bottom-2 right-2 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform duration-300 group-hover:scale-125 bg-blue-500"
                >
                  <PlayCircle className="h-8 w-8 text-white" />
                </div>
                <div className="absolute top-2 left-2 rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-yellow-900 shadow-md">
                  {t('patient.education.lesson.coins', { coins: item.rewardCoins })}
                </div>
                {item.progress?.status === 'completed' && (
                  <div className="absolute top-2 right-2 rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white shadow-md flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> {t('patient.education.lesson.completed')}
                  </div>
                )}
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
                {t('patient.education.lesson.watchAndQuiz')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                <iframe
                  className="h-full w-full"
                  src={selected.videoUrl}
                  title={selected.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <div className="space-y-3">
                {(selected.quiz || []).map((q, idx) => (
                  <div key={q.id} className="rounded-lg border p-3">
                    <p className="font-semibold">{idx + 1}. {q.prompt}</p>
                    <div className="mt-2 grid gap-2">
                      {q.options.map((opt, optIdx) => (
                        <label key={optIdx} className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            checked={answers[idx] === optIdx}
                            onChange={() => setAnswers((prev) => prev.map((v, i) => (i === idx ? optIdx : v)))}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              {t('patient.education.quiz.close')}
            </Button>
            <Button onClick={submit} disabled={!canSubmit || submitting}>
              {submitting ? t('patient.education.quiz.submitting') : t('patient.education.quiz.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Education
