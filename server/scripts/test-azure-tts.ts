/**
 * Script para testar Azure TTS
 */

import 'dotenv/config'
import { AzureTTSService } from '../services/azureTTS'
import { TTSFactory } from '../services/ttsFactory'

async function testAzureTTS() {
  console.log('🧪 Teste de Azure TTS\n')

  // Verificar configuração
  console.log('1️⃣ Verificando configuração do Azure...')
  const isConfigured = AzureTTSService.isConfigured()
  console.log(`   Azure configurado: ${isConfigured ? '✅ Sim' : '❌ Não'}\n`)

  if (!isConfigured) {
    console.error('❌ Azure TTS não está configurado!')
    console.error('   Certifique-se de que AZURE_SPEECH_KEY e AZURE_SPEECH_REGION estão no .env')
    process.exit(1)
  }

  // Listar vozes disponíveis
  console.log('2️⃣ Vozes disponíveis no Azure:')
  const voices = AzureTTSService.listAvailableVoices()
  voices.forEach(({ language, voice }) => {
    console.log(`   ${language}: ${voice}`)
  })
  console.log('')

  // Testar geração de áudio pt-PT
  console.log('3️⃣ Testando geração de áudio em pt-PT...')
  const testTextPtPT = 'Olá! Este é um teste de áudio em Português de Portugal. O meu nome é Fernanda e vou contar-vos uma história mágica.'

  try {
    const result = await AzureTTSService.generateSpeech(testTextPtPT, {
      language: 'pt-PT',
    })

    console.log('   ✅ Áudio gerado com sucesso!')
    console.log(`   📁 Caminho: ${result.audioPath}`)
    console.log(`   🌐 URL: ${result.audioUrl}`)
    console.log(`   📊 Tamanho: ${(result.sizeBytes / 1024).toFixed(2)} KB`)
    console.log(`   ⏱️  Duração estimada: ${result.durationSeconds}s`)
    console.log('')
  } catch (error) {
    console.error('   ❌ Erro ao gerar áudio:', error)
    process.exit(1)
  }

  // Testar factory
  console.log('4️⃣ Testando TTSFactory...')
  console.log('')

  const testLanguages = ['pt-PT', 'pt-BR', 'en-US', 'es-ES']

  for (const lang of testLanguages) {
    const info = TTSFactory.getServiceInfo(lang)
    console.log(`   ${lang}:`)
    console.log(`      Serviço: ${info.service}`)
    console.log(`      Motivo: ${info.reason}`)
    console.log(`      Custo: $${info.costPer1MChars}/1M chars`)
    console.log('')
  }

  // Testar geração de capítulo via factory
  console.log('5️⃣ Testando geração de capítulo via TTSFactory (pt-PT)...')
  const testChapterTitle = 'Capítulo 1: A Aventura Começa'
  const testChapterContent = 'Era uma vez, num reino muito distante, vivia uma menina chamada Sofia. Ela adorava explorar florestas mágicas e descobrir tesouros escondidos.'

  try {
    const result = await TTSFactory.generateChapterAudio(
      testChapterTitle,
      testChapterContent,
      'pt-PT'
    )

    console.log('   ✅ Capítulo gerado com sucesso via Factory!')
    console.log(`   📁 Caminho: ${result.audioPath}`)
    console.log(`   🌐 URL: ${result.audioUrl}`)
    console.log(`   📊 Tamanho: ${(result.sizeBytes / 1024).toFixed(2)} KB`)
    console.log(`   ⏱️  Duração: ${result.durationSeconds}s`)
    console.log('')
  } catch (error) {
    console.error('   ❌ Erro ao gerar capítulo:', error)
    process.exit(1)
  }

  console.log('✅ Todos os testes passaram!')
  console.log('')
  console.log('🎉 Azure TTS está funcionando corretamente para pt-PT!')

  process.exit(0)
}

testAzureTTS()
