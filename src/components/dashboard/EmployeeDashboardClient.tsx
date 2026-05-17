"use client";

type Props = {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };

//   goals: any[];
goals: {
  id: string;
  status: string;
  progress: number;
}[];

  stats: {
    totalGoals: number;
    approvedGoals: number;
    draftGoals: number;
    pendingGoals: number;
    avgProgress: number;
    totalWeightage: number;
    currentQuarter: number;
    currentYear: number;
  };
};

export function EmployeeDashboardClient({
  user,
  goals,
  stats,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome, {user.name}
        </h1>

        <p className="text-muted-foreground">
          Quarter {stats.currentQuarter} • {stats.currentYear}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Total Goals</p>
          <h2 className="text-2xl font-bold">{stats.totalGoals}</h2>
        </div>

        <div className="border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Approved</p>
          <h2 className="text-2xl font-bold">{stats.approvedGoals}</h2>
        </div>

        <div className="border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <h2 className="text-2xl font-bold">{stats.pendingGoals}</h2>
        </div>

        <div className="border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Progress</p>
          <h2 className="text-2xl font-bold">{stats.avgProgress}%</h2>
        </div>
      </div>

      <div className="border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Goals</h2>

        <div className="space-y-3">
          {goals.map((goal, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <h3 className="font-medium">
                  {goal.id}
                </h3>

                <p className="text-sm text-muted-foreground">
                  {goal.status}
                </p>
              </div>

              <div className="text-right">
                <p className="font-semibold">
                  {goal.progress}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}