/**
 * Monitora ativação do Azure Speech Service
 */

import 'dotenv/config'

async function checkAzureStatus() {
  const key = process.env.AZURE_SPEECH_KEY
  const region = process.env.AZURE_SPEECH_REGION || 'eastus'

  if (!key) {
    console.error('❌ AZURE_SPEECH_KEY não encontrada')
    return false
  }

  try {
    const endpoint = `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issuetoken`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    return response.ok
  } catch (error) {
    return false
  }
}

async function monitorActivation() {
  console.log('🔄 Monitorando ativação do Azure Speech Service...\n')
  console.log('⏰ Verificando a cada 10 segundos...')
  console.log('🛑 Pressione Ctrl+C para parar\n')

  let attempts = 0
  const maxAttempts = 60 // 10 minutos

  const interval = setInterval(async () => {
    attempts++
    const timestamp = new Date().toLocaleTimeString('pt-BR')

    process.stdout.write(`[${timestamp}] Tentativa ${attempts}/${maxAttempts}... `)

    const isActive = await checkAzureStatus()

    if (isActive) {
      console.log('✅ SERVIÇO ATIVO!')
      console.log('\n🎉 Azure Speech Service está funcionando!')
      console.log('\n📝 Próximo passo: Execute o script de teste:')
      console.log('   npx tsx server/scripts/test-azure-tts.ts\n')
      clearInterval(interval)
      process.exit(0)
    } else {
      console.log('⏳ Aguardando...')
    }

    if (attempts >= maxAttempts) {
      console.log('\n⚠️  Timeout alcançado (10 minutos)')
      console.log('\n🔍 Possíveis causas:')
      console.log('   1. Serviço ainda está sendo provisionado (pode levar mais tempo)')
      console.log('   2. Chave ou região incorretas')
      console.log('   3. Problema de permissões no Azure')
      console.log('\n💡 Sugestões:')
      console.log('   - Verifique o status no Azure Portal')
      console.log('   - Confirme que o serviço está na região "East US"')
      console.log('   - Regenere as chaves se necessário')
      clearInterval(interval)
      process.exit(1)
    }
  }, 10000) // Verifica a cada 10 segundos
}

console.log('╔════════════════════════════════════════════════════════════╗')
console.log('║   MONITOR DE ATIVAÇÃO - Azure Speech Service             ║')
console.log('╚════════════════════════════════════════════════════════════╝\n')

console.log('📋 Checklist - Verifique no Azure Portal:\n')
console.log('   ☐ 1. Acesse https://portal.azure.com')
console.log('   ☐ 2. Procure por "Alignerkids" nos recursos')
console.log('   ☐ 3. Verifique se o Status está "Succeeded" (não "Creating")')
console.log('   ☐ 4. Confirme a região: East US')
console.log('   ☐ 5. Verifique se não há alertas ou erros')
console.log('\n' + '─'.repeat(60) + '\n')

monitorActivation()
