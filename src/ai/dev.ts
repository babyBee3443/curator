
import { config } from 'dotenv';
config();

// suggest-content-ideas.ts artık suggestSingleContentIdea olarak yeniden adlandırıldı veya işlevi değişti.
// Eğer dosya adı değiştiyse veya artık bu şekilde çağrılmıyorsa, bu satırı güncelleyin.
// Şimdilik dosya adının aynı kaldığını varsayıyorum (içeriği değişse de).
import '@/ai/flows/suggest-content-ideas.ts';
import '@/ai/flows/optimize-post-hashtags.ts';
import '@/ai/flows/generate-post-captions.ts';
import '@/ai/flows/generate-post-image.ts';
