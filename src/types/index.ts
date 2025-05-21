
export interface Post {
  id: string;
  topic: string;
  keyInformation: string;
  caption: string;
  hashtags: string[];
  imageUrl: string;
  imageHint?: string;
  simulatedPostTime: Date;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ContentIdea {
  id: string;
  idea: string;
}
