"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Github, Chrome, UserPlus } from "lucide-react"
import Link from "next/link"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function LoginPage() {
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`
  }

  const handleGitHubLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/github`
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Log in to access your ESOP dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Button 
              onClick={handleGoogleLogin} 
              className="w-full"
              variant="outline"
            >
              <Chrome className="mr-2" size={18} />
              Log in with Google
            </Button>
            <Button 
              onClick={handleGitHubLogin} 
              className="w-full"
              variant="outline"
            >
              <Github className="mr-2" size={18} />
              Log in with GitHub
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              Don't have an account?
            </p>
            <Link href="/signup">
              <Button 
                variant="default" 
                className="w-full"
              >
                <UserPlus className="mr-2" size={16} />
                Create Account
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
