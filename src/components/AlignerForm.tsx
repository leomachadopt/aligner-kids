import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Aligner } from '@/types/aligner'

const alignerFormSchema = z.object({
  number: z.number().min(1, 'Número deve ser maior que 0'),
  patientId: z.string().min(1, 'ID do paciente é obrigatório'),
  changeInterval: z.number().min(1, 'Intervalo deve ser pelo menos 1 dia'),
  wearTime: z.number().min(1, 'Tempo de uso deve ser pelo menos 1 hora'),
  notes: z.string().optional(),
})

export type AlignerFormValues = z.infer<typeof alignerFormSchema>

interface AlignerFormProps {
  onSubmit: (data: AlignerFormValues) => Promise<void>
  defaultValues?: Partial<AlignerFormValues>
  aligner?: Aligner
  isLoading?: boolean
}

export const AlignerForm = ({
  onSubmit,
  defaultValues,
  aligner,
  isLoading = false,
}: AlignerFormProps) => {
  const form = useForm<AlignerFormValues>({
    resolver: zodResolver(alignerFormSchema),
    defaultValues: aligner
      ? {
          number: aligner.number,
          patientId: aligner.patientId,
          changeInterval: aligner.changeInterval,
          wearTime: aligner.wearTime,
          notes: aligner.notes || '',
        }
      : {
          number: defaultValues?.number ?? 1,
          patientId: defaultValues?.patientId ?? '',
          changeInterval: defaultValues?.changeInterval ?? 14,
          wearTime: defaultValues?.wearTime ?? 22,
          notes: defaultValues?.notes ?? '',
        },
  })

  // Atualizar patientId e number quando defaultValues mudarem
  useEffect(() => {
    if (!aligner) {
      if (defaultValues?.patientId) {
        form.setValue('patientId', defaultValues.patientId)
      }
      if (defaultValues?.number) {
        form.setValue('number', defaultValues.number)
      }
    }
  }, [defaultValues?.patientId, defaultValues?.number, aligner, form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número do Alinhador</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                  disabled={!!aligner}
                />
              </FormControl>
              <FormDescription>
                Número sequencial do alinhador no tratamento
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {!defaultValues?.patientId && (
          <FormField
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID do Paciente</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!!aligner} />
                </FormControl>
                <FormDescription>
                  Identificador único do paciente
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="changeInterval"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Intervalo de Troca (dias)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                />
              </FormControl>
              <FormDescription>
                Quantos dias o paciente deve usar este alinhador antes de trocar
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="wearTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tempo de Uso Diário (horas)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.5"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Quantas horas por dia o paciente deve usar o alinhador
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Observações sobre este alinhador..."
                  rows={4}
                />
              </FormControl>
              <FormDescription>
                Notas adicionais sobre o alinhador (opcional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading
            ? 'Salvando...'
            : aligner
              ? 'Atualizar Alinhador'
              : 'Cadastrar Alinhador'}
        </Button>
      </form>
    </Form>
  )
}

