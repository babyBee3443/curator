
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

// ContentIdea arayüzü artık doğrudan PostCreator'da kullanılmayabilir,
// çünkü AI tek bir yapılandırılmış fikir döndürecek ve bu doğrudan state'lere atanacak.
// Eğer başka bir yerde kullanılmıyorsa kaldırılabilir. Şimdilik tutuyorum.
export interface ContentIdea {
  id: string; // Bu ID artık gereksiz olabilir eğer tek fikir üretiyorsak
  topic: string;
  keyInformation: string;
}
