"use client";

import { useState, useEffect } from "react";
import { ref, onValue, update, set, push } from "firebase/database";
import { db } from "@/lib/firebase";
import { DatabaseSchema, Member } from "@/types";
import { Lock, Search, Save, Gift, RefreshCw, Beer } from "lucide-react";

export default function AdminPage() {
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState<DatabaseSchema | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    const dbRef = ref(db, "/");
    return onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        setData(snapshot.val());
      }
    });
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === process.env.NEXT_PUBLIC_ADMIN_PIN) {
      setIsAuthenticated(true);
    } else {
      alert("Invalid PIN");
    }
  };

  const updateCalorie = async (teamId: string, memberId: string, newCalorie: number) => {
    const caloriePath = `teams/${teamId}/members/${memberId}/calories`;
    await update(ref(db), { [caloriePath]: newCalorie });

    // Check if team goal reached
    const team = data?.teams[teamId];
    if (team) {
      const currentTotal = Object.entries(team.members).reduce((sum, [id, m]) => {
        return sum + (id === memberId ? newCalorie : m.calories);
      }, 0);

      if (currentTotal >= (data?.event.targetCalories || 10000) && !team.completedAt) {
        await update(ref(db), { [`teams/${teamId}/completedAt`]: Date.now() });
      } else if (currentTotal < (data?.event.targetCalories || 10000) && team.completedAt) {
        await update(ref(db), { [`teams/${teamId}/completedAt`]: null });
      }
    }
  };

  const updateBeerpong = async (name: string, score: number) => {
    // Find player by name or create new
    const playerEntry = Object.entries(data?.beerpong || {}).find(([_, p]) => p.name === name);
    if (playerEntry) {
      await update(ref(db), { [`beerpong/${playerEntry[0]}/score`]: score });
    } else {
      const newPlayerRef = push(ref(db, 'beerpong'));
      await set(newPlayerRef, { name, score });
    }
  };

  const drawLottery = () => {
    if (!data) return;
    const allMembers: string[] = [];
    Object.values(data.teams).forEach(team => {
      Object.values(team.members).forEach(m => allMembers.push(m.name));
    });
    const randomWinner = allMembers[Math.floor(Math.random() * allMembers.length)];
    setWinner(randomWinner);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <form onSubmit={handleAuth} className="w-full max-w-sm space-y-4 rounded-2xl bg-gray-900 p-8 shadow-xl">
          <div className="flex justify-center text-blue-400">
            <Lock size={48} />
          </div>
          <h1 className="text-center text-2xl font-bold">ADMIN ACCESS</h1>
          <input
            type="password"
            placeholder="Enter PIN"
            className="w-full rounded-lg bg-black p-4 text-center text-2xl tracking-widest outline-none focus:ring-2 focus:ring-blue-500"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          <button type="submit" className="w-full rounded-lg bg-blue-600 p-4 font-bold hover:bg-blue-700">
            ENTER
          </button>
        </form>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">ADMIN PANEL</h1>
        <button onClick={() => setIsAuthenticated(false)} className="text-gray-500 underline">Logout</button>
      </header>

      <div className="space-y-8">
        <section className="rounded-2xl bg-gray-900 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-blue-400">
            <Gift size={24} /> LUCKY DRAW
          </h2>
          <div className="flex items-center gap-4">
            <button onClick={drawLottery} className="rounded-lg bg-purple-600 px-6 py-3 font-bold hover:bg-purple-700">
              PICK A WINNER
            </button>
            {winner && (
              <div className="animate-bounce text-2xl font-black text-yellow-400">
                🎉 {winner}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-gray-900 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-green-400">
            <Search size={24} /> CALORIE INPUT
          </h2>
          <input
            type="text"
            placeholder="Search participant name..."
            className="mb-6 w-full rounded-lg bg-black p-4 outline-none focus:ring-2 focus:ring-green-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="space-y-4">
            {data && Object.entries(data.teams).map(([teamId, team]) => (
              Object.entries(team.members)
                .filter(([_, m]) => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(([memberId, member]) => (
                  <div key={memberId} className="flex flex-col gap-4 rounded-xl bg-black p-4 sm:flex-row sm:items-center">
                    <div className="flex-1">
                      <div className="font-bold">{member.name}</div>
                      <div className="text-xs" style={{ color: team.color }}>{team.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        defaultValue={member.calories}
                        className="w-24 rounded bg-gray-800 p-2 text-right font-mono font-bold"
                        onBlur={(e) => updateCalorie(teamId, memberId, parseInt(e.target.value) || 0)}
                      />
                      <span className="text-gray-500">kcal</span>
                    </div>
                  </div>
                ))
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-gray-900 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-orange-400">
            <Beer size={24} /> BEERPONG INPUT
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Add/Update Score</label>
              <div className="flex gap-2">
                <input id="bp-name" type="text" placeholder="Name" className="flex-1 rounded bg-black p-2" />
                <input id="bp-score" type="number" placeholder="Score" className="w-20 rounded bg-black p-2" />
                <button 
                  onClick={() => {
                    const name = (document.getElementById('bp-name') as HTMLInputElement).value;
                    const score = parseInt((document.getElementById('bp-score') as HTMLInputElement).value) || 0;
                    if(name) updateBeerpong(name, score);
                  }}
                  className="rounded bg-orange-600 p-2"
                >
                  <Save size={20} />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            {data && Object.entries(data.beerpong || {}).sort((a,b) => b[1].score - a[1].score).map(([id, p]) => (
              <div key={id} className="flex items-center justify-between border-b border-gray-800 py-2">
                <span>{p.name}</span>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-orange-400">{p.score} pts</span>
                  <button onClick={() => updateBeerpong(p.name, 0)} className="text-gray-600 hover:text-red-500">
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
