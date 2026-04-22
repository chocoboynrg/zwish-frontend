export interface EventParticipantUser {
  id: number;
  name: string;
  email: string;
}

export interface EventParticipantItem {
  id: number;
  role: string;
  status: string;
  joinedAt: string | null;
  user: EventParticipantUser;
}

export interface EventParticipantsResponse {
  total: number;
  participants: EventParticipantItem[];
}
