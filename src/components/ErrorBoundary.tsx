import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    // 生产环境可上报错误日志
    console.error('[ErrorBoundary] 捕获错误:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.href = '/'
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center">
              <div className="text-5xl mb-4">😵</div>
              <h1 className="text-xl font-bold text-foreground mb-2">
                出错了
              </h1>
              <p className="text-sm text-muted-foreground mb-4">
                应用遇到了一个意外错误，请尝试刷新页面或返回首页。
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left mb-4 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40">
                  <summary className="font-medium cursor-pointer text-foreground">
                    错误详情
                  </summary>
                  <pre className="mt-2 text-muted-foreground whitespace-pre-wrap">
                    {this.state.error.message}
                    {'\n'}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={this.handleReload}>
                  刷新页面
                </Button>
                <Button onClick={this.handleReset}>
                  返回首页
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
