import { NextResponse } from 'next/server'

export async function GET() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
  
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch(`${backendUrl}/health`, {
      signal: controller.signal,
    })
    
    clearTimeout(timeout)
    
    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        status: 'healthy',
        backend_url: backendUrl,
        backend_response: data,
        timestamp: new Date().toISOString(),
      })
    } else {
      return NextResponse.json({
        status: 'unhealthy',
        backend_url: backendUrl,
        error: `Backend returned status ${response.status}`,
        timestamp: new Date().toISOString(),
      }, { status: 503 })
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({
      status: 'unreachable',
      backend_url: backendUrl,
      error: `Cannot reach backend: ${errorMsg}`,
      timestamp: new Date().toISOString(),
    }, { status: 503 })
  }
}
