import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Smile, CheckCircle, AlertTriangle } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const usageData = [
  { name: 'Horas com Alinhador', value: 22, color: '#28a745' },
  { name: 'Horas sem Alinhador', value: 2, color: '#dc3545' },
]

const PatientReports = () => {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col items-center text-center">
        <img
          src="https://img.usecurling.com/p/150/150?q=magnifying%20glass%20mascot"
          alt="Mascote Detetive"
          className="mb-4"
        />
        <h1 className="font-display text-4xl font-extrabold text-primary">
          Relatório do Detetive
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Veja como está a sua investigação por um sorriso perfeito!
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Uso Diário</CardTitle>
          </CardHeader>
          <CardContent className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={usageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={(entry) => `${entry.name}: ${entry.value}h`}
                >
                  {usageData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center">
          <CardHeader>
            <CardTitle>Saúde da Gengiva</CardTitle>
          </CardHeader>
          <CardContent>
            <Smile className="h-20 w-20 text-green-500" />
            <p className="mt-2 font-bold text-lg">Tudo Ótimo!</p>
          </CardContent>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center">
          <CardHeader>
            <CardTitle>Próxima Consulta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">25/12</p>
            <p className="text-muted-foreground">Faltam 10 dias</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo do Doutor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-500" />
            <p>
              <span className="font-bold">Parabéns!</span> Você está usando seus
              alinhadores direitinho.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 flex-shrink-0 text-yellow-500" />
            <p>
              <span className="font-bold">Atenção:</span> Lembre-se de escovar
              bem os dentes após comer.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PatientReports
