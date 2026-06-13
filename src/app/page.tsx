"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { DatabaseSchema, Team, BeerpongPlayer } from "@/types";
import { Trophy, Zap, Beer } from "lucide-react";

export default function DisplayPage() {
  const [data, setData] = useState<DatabaseSchema | null>(null);

  useEffect(() => {
    const dbRef = ref(db, "/");
    return onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        setData(snapshot.val());
      }
    });
  }, []);

  if (!data) return <div className="flex h-screen items-center justify-center text-2xl">Loading...</div>;

  const teams = Object.entries(data.teams || {}).map(([id, team]) => {
    const totalCalories = Object.values(team.members || {}).reduce((sum, m) => sum + (m.calories || 0), 0);
    const progress = Math.min((totalCalories / data.event.targetCalories) * 100, 100);
    return { id, ...team, totalCalories, progress };
  });

  // Sort teams by progress, then by completedAt
  const sortedTeams = [...teams].sort((a, b) => {
    if (a.completedAt && b.completedAt) return a.completedAt - b.completedAt;
    if (a.completedAt) return -1;
    if (b.completedAt) return 1;
    return b.totalCalories - a.totalCalories;
  });

  const beerpongPlayers = Object.entries(data.beerpong || {})
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <main className="p-8">
      <header className="mb-12 text-center">
        <h1 className="text-6xl font-black italic tracking-tighter text-yellow-400">
          {data.event.name}
        </h1>
        <p className="mt-2 text-xl font-bold text-gray-400">GOAL: {data.event.targetCalories.toLocaleString()} KCAL PER TEAM</p>
      </header>

      <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
        {sortedTeams.map((team, index) => (
          <div 
            key={team.id} 
            className="relative flex flex-col rounded-3xl border-4 border-gray-800 bg-gray-900 p-6 shadow-2xl transition-all"
            style={{ borderColor: team.progress >= 100 ? team.color : '#1f2937' }}
          >
            {team.progress >= 100 && (
              <div className="absolute -right-4 -top-4 animate-bounce rounded-full bg-yellow-400 p-3 text-black shadow-lg">
                <Trophy size={32} />
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-bold" style={{ color: team.color }}>{team.name}</h2>
              <span className="text-4xl font-black">{Math.floor(team.progress)}%</span>
            </div>
            
            <div className="mb-6 h-8 w-full overflow-hidden rounded-full bg-gray-800">
              <div 
                className="h-full transition-all duration-1000 ease-out"
                style={{ width: `${team.progress}%`, backgroundColor: team.color }}
              />
            </div>

            <div className="mb-8 text-center">
              <div className="text-5xl font-black">{team.totalCalories.toLocaleString()}</div>
              <div className="text-gray-500">KCAL</div>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-48 custom-scrollbar">
              {Object.values(team.members || {}).sort((a,b) => b.calories - a.calories).map((member, i) => (
                <div key={i} className="flex justify-between rounded-lg bg-black/30 p-2 text-sm">
                  <span className="font-medium">{member.name}</span>
                  <span className="font-bold text-gray-400">{member.calories} kcal</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-2 gap-8">
        <section className="rounded-3xl bg-gray-900 p-8">
          <h3 className="mb-6 flex items-center gap-3 text-3xl font-bold text-blue-400">
            <Zap size={32} /> TEAM RANKING
          </h3>
          <div className="space-y-4">
            {sortedTeams.map((team, i) => (
              <div key={team.id} className="flex items-center justify-between rounded-xl bg-black p-4">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-black text-gray-600">#{i + 1}</span>
                  <span className="text-xl font-bold">{team.name}</span>
                </div>
                <div className="text-xl font-black" style={{ color: team.color }}>
                  {team.totalCalories.toLocaleString()} KCAL
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-gray-900 p-8">
          <h3 className="mb-6 flex items-center gap-3 text-3xl font-bold text-orange-400">
            <Beer size={32} /> BEERPONG TOP 5
          </h3>
          <div className="space-y-4">
            {beerpongPlayers.map((player, i) => (
              <div key={player.id} className="flex items-center justify-between rounded-xl bg-black p-4">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-black text-gray-600">#{i + 1}</span>
                  <span className="text-xl font-bold">{player.name}</span>
                </div>
                <div className="text-2xl font-black text-orange-400">{player.score} PTS</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
