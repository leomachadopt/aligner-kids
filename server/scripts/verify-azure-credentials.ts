/**
 * Verifica se as credenciais do Azure estão corretas
 */

import 'dotenv/config'

async function verifyCredentials() {
  console.log('🔍 Verificando credenciais do Azure...\n')

  const key = process.env.AZURE_SPEECH_KEY
  const region = process.env.AZURE_SPEECH_REGION

  console.log('Variáveis de ambiente:')
  console.log(`AZURE_SPEECH_KEY: ${key ? '✅ Definida' : '❌ Não definida'}`)
  console.log(`AZURE_SPEECH_REGION: ${region || 'eastus (padrão)'}`)
  console.log('')

  if (!key) {
    console.error('❌ AZURE_SPEECH_KEY não encontrada no .env')
    process.exit(1)
  }

  console.log('Primeiros/últimos caracteres da chave:')
  console.log(`${key.substring(0, 10)}...${key.substring(key.length - 10)}`)
  console.log(`Comprimento: ${key.length} caracteres`)
  console.log('')

  // Testar autenticação fazendo uma requisição HTTP simples
  console.log('🌐 Testando autenticação com Azure...')

  try {
    const endpoint = `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issuetoken`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    if (response.ok) {
      console.log('✅ Autenticação bem-sucedida!')
      console.log(`Status: ${response.status} ${response.statusText}`)
      const token = await response.text()
      console.log(`Token recebido (primeiros 20 chars): ${token.substring(0, 20)}...`)
    } else {
      console.error(`❌ Falha na autenticação: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error(`Erro: ${errorText}`)
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Erro ao conectar com Azure:', error)
    process.exit(1)
  }

  console.log('')
  console.log('✅ Credenciais verificadas e funcionando!')
}

verifyCredentials()
