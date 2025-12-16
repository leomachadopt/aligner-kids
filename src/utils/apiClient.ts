/**
 * API Client - Utility for making API requests to the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

interface ApiResponse<T> {
  data?: T
  error?: string
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  setToken(token: string | null) {
    this.token = token
  }

  getToken(): string | null {
    return this.token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 3,
    backoff = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...options.headers,
        }

        // Add authorization header if token exists
        if (this.token) {
          headers['Authorization'] = `Bearer ${this.token}`
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, {
          ...options,
          headers,
          credentials: 'include', // Include cookies
        })

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: 'Unknown error' }))
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          )
        }

        return response.json()
      } catch (error) {
        const isLastAttempt = attempt === retries - 1
        const isNetworkError =
          error instanceof TypeError && error.message === 'Failed to fetch'

        // Se for o último retry ou não for erro de rede, joga o erro
        if (isLastAttempt || !isNetworkError) {
          throw error
        }

        // Aguarda antes de tentar novamente (exponential backoff)
        console.log(
          `🔄 Tentativa ${attempt + 1}/${retries} falhou. Tentando novamente em ${backoff}ms...`
        )
        await new Promise((resolve) => setTimeout(resolve, backoff))
        backoff *= 2 // Dobra o tempo de espera a cada tentativa
      }
    }

    throw new Error('Max retries reached')
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    })
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    })
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL)
