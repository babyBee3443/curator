
export interface Post {
  id: string;
  topic: string;
  keyInformation: string;
  caption: string;
  hashtags: string[];
  imageUrl: string; // Can be a placeholder URL or a data URI for generated images
  imageHint?: string;
  simulatedPostTime: Date;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ContentIdea {
  id: string;
  idea: string;
}
