export type AgentConfig = {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role?: string;
  desc?: string;
  soul?: string;
  capabilities?: string[];
};

export type RoomConfig = {
  roomId: string;
  name: string;
  agents: AgentConfig[];
  apiKey: string;
  created: number;
  maxEvents?: number;
};
