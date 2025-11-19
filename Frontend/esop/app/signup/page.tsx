"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Github, Chrome, ArrowLeft } from "lucide-react"
import Link from "next/link"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function SignupPage() {
  const handleGoogleSignup = () => {
    window.location.href = `${API_BASE_URL}/auth/google`
  }

  const handleGitHubSignup = () => {
    window.location.href = `${API_BASE_URL}/auth/github`
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            Sign up to start managing your ESOP portfolio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Button 
              onClick={handleGoogleSignup} 
              className="w-full"
              variant="outline"
            >
              <Chrome className="mr-2" size={18} />
              Sign up with Google
            </Button>
            
            <Button 
              onClick={handleGitHubSignup} 
              className="w-full"
              variant="outline"
            >
              <Github className="mr-2" size={18} />
              Sign up with GitHub
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              Already have an account?
            </p>
            <Link href="/login">
              <Button 
                variant="default" 
                className="w-full"
              >
                <ArrowLeft className="mr-2" size={16} />
                Back to Login
              </Button>
            </Link>
          </div>

          <div className="text-center pt-4">
            <p className="text-xs text-muted-foreground">
              By signing up, you agree to our{" "}
              <a href="#" className="text-primary hover:underline">Terms of Service</a>
              {" "}and{" "}
              <a href="#" className="text-primary hover:underline">Privacy Policy</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
