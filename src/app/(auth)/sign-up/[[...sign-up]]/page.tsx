import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">GoalTrack</h1>
          <p className="text-slate-400 mt-2">Create your account</p>
        </div>
        <SignUp />
      </div>
    </div>
  );
}