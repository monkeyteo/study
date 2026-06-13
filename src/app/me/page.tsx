"use client";

import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { DatabaseSchema, Team, Member } from "@/types";
import { User, Users, Target, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function MePage() {
  const [data, setData] = useState<DatabaseSchema | null>(null);
  const [searchName, setSearchName] = useState("");
  const [myInfo, setMyInfo] = useState<{ team: Team; member: Member } | null>(null);

  useEffect(() => {
    const dbRef = ref(db, "/");
    return onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        setData(snapshot.val());
      }
    });
  }, []);

  const handleSearch = () => {
    if (!data || !searchName) return;
    
    let found = null;
    for (const teamId in data.teams) {
      const team = data.teams[teamId];
      for (const memberId in team.members) {
        const member = team.members[memberId];
        if (member.name === searchName) {
          found = { team, member };
          break;
        }
      }
      if (found) break;
    }
    setMyInfo(found);
    if (!found) alert("참가자를 찾을 수 없습니다.");
  };

  if (!data) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <main className="mx-auto max-w-lg p-6">
      <Link href="/" className="mb-8 flex items-center gap-2 text-gray-400">
        <ChevronLeft size={20} /> Back to Dashboard
      </Link>

      <h1 className="mb-8 text-4xl font-black italic">MY CALORIES</h1>

      {!myInfo ? (
        <div className="space-y-4 rounded-2xl bg-gray-900 p-8 shadow-xl">
          <p className="text-gray-400">이름을 입력하여 본인의 기록을 확인하세요.</p>
          <input
            type="text"
            placeholder="이름 입력 (예: 홍길동)"
            className="w-full rounded-lg bg-black p-4 text-xl outline-none focus:ring-2 focus:ring-yellow-400"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button 
            onClick={handleSearch}
            className="w-full rounded-lg bg-yellow-400 p-4 font-bold text-black hover:bg-yellow-500"
          >
            기록 조회하기
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl bg-gray-900 p-8 shadow-xl">
            <div className="mb-4 flex items-center gap-3 text-gray-400">
              <User size={24} />
              <span className="text-lg font-bold">내 정보</span>
            </div>
            <div className="text-5xl font-black">{myInfo.member.name}</div>
            <div className="mt-4 flex items-end gap-2">
              <div className="text-6xl font-black text-yellow-400">{myInfo.member.calories}</div>
              <div className="mb-2 text-xl font-bold text-gray-500">KCAL</div>
            </div>
          </section>

          <section className="rounded-2xl bg-gray-900 p-8 shadow-xl" style={{ borderLeft: `8px solid ${myInfo.team.color}` }}>
            <div className="mb-4 flex items-center gap-3 text-gray-400">
              <Users size={24} />
              <span className="text-lg font-bold">우리 팀 현황</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: myInfo.team.color }}>{myInfo.team.name}</div>
            
            {/* Team Progress calculation */}
            {(() => {
              const teamTotal = Object.values(myInfo.team.members).reduce((sum, m) => sum + m.calories, 0);
              const progress = Math.min((teamTotal / data.event.targetCalories) * 100, 100);
              return (
                <div className="mt-6">
                  <div className="mb-2 flex justify-between font-bold">
                    <span>{teamTotal.toLocaleString()} / {data.event.targetCalories.toLocaleString()} KCAL</span>
                    <span>{Math.floor(progress)}%</span>
                  </div>
                  <div className="h-4 w-full overflow-hidden rounded-full bg-black">
                    <div 
                      className="h-full transition-all duration-1000"
                      style={{ width: `${progress}%`, backgroundColor: myInfo.team.color }}
                    />
                  </div>
                </div>
              );
            })()}
          </section>

          <button 
            onClick={() => { setMyInfo(null); setSearchName(""); }}
            className="w-full rounded-lg bg-gray-800 p-4 font-bold text-gray-400 hover:bg-gray-700"
          >
            다른 이름 검색
          </button>
        </div>
      )}
    </main>
  );
}
