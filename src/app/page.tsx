"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { DatabaseSchema } from "@/types";
import { Trophy, Zap, Beer, Activity, Users, Award, ChevronDown } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const [data, setData] = useState<DatabaseSchema | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dbRef = ref(db, "/");
    return onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        setData(snapshot.val());
      }
      setLoading(false);
    });
  }, []);

  const teams = data ? Object.entries(data.teams || {}).map(([id, team]) => {
    const totalCalories = Object.values(team.members || {}).reduce((sum, m) => sum + (m.calories || 0), 0);
    const progress = Math.min((totalCalories / data.event.targetCalories) * 100, 100);
    return { id, ...team, totalCalories, progress };
  }) : [];

  const sortedTeams = [...teams].sort((a, b) => {
    if (a.completedAt && b.completedAt) return a.completedAt - b.completedAt;
    if (a.completedAt) return -1;
    if (b.completedAt) return 1;
    return b.totalCalories - a.totalCalories;
  });

  const beerpongPlayers = data ? Object.entries(data.beerpong || {})
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5) : [];

  return (
    <div className="flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-2xl font-black italic tracking-tighter text-yellow-400">
            CALORIE CHALLENGE
          </Link>
          <div className="flex gap-8 font-bold text-gray-400">
            <Link href="#dashboard" className="hover:text-white transition-colors">LIVE STATUS</Link>
            <Link href="/me" className="hover:text-white transition-colors">MY RECORD</Link>
            <Link href="/admin" className="hover:text-white transition-colors">ADMIN</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex h-screen flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-900/20 via-black to-black px-6 text-center">
        <div className="relative z-10 animate-fade-in-up">
          <h2 className="mb-4 text-xl font-bold tracking-widest text-yellow-500">2026 FITNESS SOCIAL EVENT</h2>
          <h1 className="mb-8 text-7xl font-black italic leading-none tracking-tighter sm:text-9xl">
            CALORIE<br />CHALLENGE
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-400">
            4팀, 40명의 참가자가 함께하는 한계 돌파 프로젝트.<br />
            팀 합산 10,000 kcal를 달성하고 치맥존에 입성하세요.
          </p>
          <div className="mt-12 flex justify-center gap-6">
            <Link href="#dashboard" className="rounded-full bg-yellow-400 px-8 py-4 text-lg font-black text-black transition-transform hover:scale-105">
              실시간 현황판 보기
            </Link>
            <Link href="/me" className="rounded-full border-2 border-white/20 px-8 py-4 text-lg font-black transition-colors hover:bg-white/10">
              내 기록 확인
            </Link>
          </div>
        </div>
        <div className="absolute bottom-10 animate-bounce text-gray-500">
          <ChevronDown size={48} />
        </div>
      </section>

      {/* Live Dashboard Section */}
      <section id="dashboard" className="min-h-screen bg-black px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 flex items-end justify-between border-b border-white/10 pb-8">
            <div>
              <h2 className="text-5xl font-black italic tracking-tight">LIVE STATUS</h2>
              <p className="mt-2 text-gray-500">실시간 데이터 동기화 중 (Firebase Realtime DB)</p>
            </div>
            {data && (
              <div className="text-right">
                <div className="text-sm font-bold text-yellow-500">GOAL</div>
                <div className="text-4xl font-black">{data.event.targetCalories.toLocaleString()} KCAL</div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent"></div>
            </div>
          ) : !data ? (
            <div className="rounded-3xl border-2 border-dashed border-white/10 py-32 text-center">
              <Activity size={64} className="mx-auto mb-4 text-gray-700" />
              <p className="text-2xl font-bold text-gray-500">이벤트 데이터가 아직 설정되지 않았습니다.</p>
              <p className="mt-2 text-gray-400">어드민 페이지에서 데이터를 먼저 입력해주세요.</p>
              <Link href="/admin" className="mt-8 inline-block rounded-lg bg-gray-800 px-6 py-3 font-bold hover:bg-gray-700">
                어드민 페이지 바로가기
              </Link>
            </div>
          ) : (
            <>
              {/* Team Cards */}
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                {sortedTeams.map((team) => (
                  <div 
                    key={team.id} 
                    className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-gray-900/50 p-8 transition-all hover:border-white/20"
                  >
                    {team.progress >= 100 && (
                      <div className="absolute -right-12 -top-12 h-32 w-32 rotate-12 bg-yellow-400 text-black">
                        <Trophy size={48} className="absolute bottom-4 left-4" />
                      </div>
                    )}
                    
                    <div className="mb-8 flex items-center justify-between">
                      <h3 className="text-2xl font-bold" style={{ color: team.color }}>{team.name}</h3>
                      <span className="text-4xl font-black">{Math.floor(team.progress)}%</span>
                    </div>

                    <div className="mb-12 text-center">
                      <div className="text-6xl font-black">{team.totalCalories.toLocaleString()}</div>
                      <div className="text-sm font-bold text-gray-500">TOTAL KCAL</div>
                    </div>

                    <div className="mt-auto">
                      <div className="mb-2 flex justify-between text-xs font-bold text-gray-400">
                        <span>PROGRESS</span>
                        <span>{team.totalCalories.toLocaleString()} / {data.event.targetCalories.toLocaleString()}</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-black">
                        <div 
                          className="h-full transition-all duration-1000"
                          style={{ width: `${team.progress}%`, backgroundColor: team.color }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Leaderboards */}
              <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-gray-900/30 p-8">
                  <div className="mb-8 flex items-center gap-4">
                    <div className="rounded-full bg-blue-500/20 p-3 text-blue-500">
                      <Users size={24} />
                    </div>
                    <h3 className="text-2xl font-bold">TEAM RANKING</h3>
                  </div>
                  <div className="space-y-4">
                    {sortedTeams.map((team, i) => (
                      <div key={team.id} className="flex items-center justify-between rounded-2xl bg-black/40 p-5">
                        <div className="flex items-center gap-6">
                          <span className="text-3xl font-black text-gray-700">0{i + 1}</span>
                          <span className="text-xl font-bold">{team.name}</span>
                        </div>
                        <div className="text-2xl font-black" style={{ color: team.color }}>
                          {team.totalCalories.toLocaleString()} KCAL
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-gray-900/30 p-8">
                  <div className="mb-8 flex items-center gap-4">
                    <div className="rounded-full bg-orange-500/20 p-3 text-orange-500">
                      <Award size={24} />
                    </div>
                    <h3 className="text-2xl font-bold">BEERPONG TOP 5</h3>
                  </div>
                  <div className="space-y-4">
                    {beerpongPlayers.map((player, i) => (
                      <div key={player.id} className="flex items-center justify-between rounded-2xl bg-black/40 p-5">
                        <div className="flex items-center gap-6">
                          <span className="text-3xl font-black text-gray-700">0{i + 1}</span>
                          <span className="text-xl font-bold">{player.name}</span>
                        </div>
                        <div className="text-3xl font-black text-orange-500">{player.score} PTS</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black py-12 text-center text-gray-600">
        <p className="text-sm">© 2026 CALORIE CHALLENGE. ALL RIGHTS RESERVED.</p>
        <p className="mt-2 text-xs">BUILT WITH NEXT.JS & FIREBASE</p>
      </footer>
    </div>
  );
}
