import { Link } from "react-router-dom";
import { Briefcase, CheckCircle, BarChart3, Bell } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-purple-100 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white text-xs font-semibold tracking-wide">
              JT
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              JobTrack
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm">
            ✨ Your Job Search, Organized
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 bg-clip-text text-transparent">
            Track Every Application
            <br />
            Land Your Dream Job
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Stop losing track of job applications. JobTrack helps you organize, monitor, and optimize your job search journey all in one place.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8">
                Start Tracking Free
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats removed */}
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features to streamline your job search
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            <Card className="p-6 hover:shadow-lg transition-shadow border-purple-100">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <Briefcase className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Application Tracking</h3>
              <p className="text-gray-600 text-sm">
                Keep all your job applications organized in one central dashboard
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow border-purple-100">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Status Management</h3>
              <p className="text-gray-600 text-sm">
                Track your progress from application to offer with visual status updates
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow border-purple-100">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Analytics & Insights</h3>
              <p className="text-gray-600 text-sm">
                Get detailed insights into your job search performance and trends
              </p>
            </Card>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-12 text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Take Control of Your Job Search?
          </h2>
          <p className="text-xl mb-8 text-purple-100">
            Join thousands of job seekers who are landing their dream jobs with JobTrack
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Get Started for Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple-100 bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white text-[10px] font-semibold tracking-wide">
                JT
              </div>
              <span className="font-semibold text-purple-600">JobTrack</span>
            </div>
            <div className="text-sm text-gray-600">
              © 2026 JobTrack. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
