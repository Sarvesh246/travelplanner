import { VoteTopicType, VoteStatus } from "@prisma/client";

export interface VoteOptionSerialized {
  id: string;
  label: string;
  dateStart: string | null;
  dateEnd: string | null;
  sortOrder: number;
  voters: { id: string; name: string; avatarUrl: string | null }[];
  myVote: boolean;
}

export interface VoteSerialized {
  id: string;
  title: string;
  description: string | null;
  topicType: VoteTopicType;
  allowMultiple: boolean;
  isAnonymous: boolean;
  deadline: string | null;
  status: VoteStatus;
  createdAt: string;
  options: VoteOptionSerialized[];
}
