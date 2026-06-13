export interface Member {
  name: string;
  calories: number;
}

export interface Team {
  name: string;
  color: string;
  completedAt: number | null;
  members: Record<string, Member>;
}

export interface EventInfo {
  name: string;
  targetCalories: number;
  status: string;
}

export interface BeerpongPlayer {
  name: string;
  score: number;
}

export interface DatabaseSchema {
  event: EventInfo;
  teams: Record<string, Team>;
  beerpong: Record<string, BeerpongPlayer>;
}
