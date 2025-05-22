
export interface Post {
  id: string;
  topic: string; // AI tarafından üretilen genel konu
  keyInformation: string; // AI tarafından üretilen detaylı bilgi/istem
  caption: string;
  hashtags: string[];
  imageUrl: string; // Placeholder veya AI tarafından üretilen resim (data URI)
  imageHint?: string; // Resim için AI ipucu (örn: "uzay gemisi fırlatma")
  simulatedPostTime: Date;
  status: 'pending' | 'approved' | 'rejected';
}

export interface FullPostGenerationOutput {
  topic: string;
  keyInformation: string;
  caption: string;
  hashtags: string[];
  imageUrl: string;
}
