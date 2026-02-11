import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Briefcase } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-semibold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
            JobTrack
          </span>
        </div>
        <h1 className="text-6xl font-bold mb-4 text-purple-600">404</h1>
        <p className="text-xl text-gray-600 mb-8">Page not found</p>
        <Link to="/">
          <Button>Go back home</Button>
        </Link>
      </div>
    </div>
  );
}
