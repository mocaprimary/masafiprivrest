import { Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  commentAr: string;
  date: string;
  avatar?: string;
}

const reviews: Review[] = [
  {
    id: '1',
    name: 'Fatima A.',
    rating: 5,
    comment: 'The Linguine ai Frutti di Mare was incredible! Fresh seafood and perfectly al dente pasta. A true taste of Italy in the heart of the city.',
    commentAr: 'كانت لينغويني ثمار البحر لا تصدق! مأكولات بحرية طازجة ومعكرونة مطهوة بإتقان. طعم إيطاليا الحقيقي في قلب المدينة.',
    date: '2026-01-15',
  },
  {
    id: '2',
    name: 'Mohammed R.',
    rating: 5,
    comment: 'Best Italian restaurant in town! The Lasagna is homemade perfection, and the Tiramisu is heavenly. Staff is warm and welcoming.',
    commentAr: 'أفضل مطعم إيطالي في المدينة! اللازانيا منزلية الصنع مثالية، والتيراميسو رائع. الطاقم ودود ومرحب.',
    date: '2026-01-12',
  },
  {
    id: '3',
    name: 'Julia K.',
    rating: 5,
    comment: 'The Quattro Formaggi pizza was divine - crispy crust with the perfect cheese blend. Elegant ambiance perfect for date nights!',
    commentAr: 'بيتزا الأجبان الأربعة كانت رائعة - قشرة مقرمشة مع مزيج الجبن المثالي. أجواء راقية مثالية للعشاء الرومانسي!',
    date: '2026-01-08',
  },
  {
    id: '4',
    name: 'Omar S.',
    rating: 5,
    comment: 'Authentic Italian flavors! The Fettuccine Alfredo was creamy and rich. Great wine selection too. Highly recommend!',
    commentAr: 'نكهات إيطالية أصيلة! فيتوتشيني ألفريدو كريمية وغنية. مجموعة رائعة من النبيذ أيضاً. أنصح به بشدة!',
    date: '2026-01-05',
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3 h-3 ${
            star <= rating
              ? 'fill-primary text-primary'
              : 'fill-muted text-muted'
          }`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  const { language } = useLanguage();
  const comment = language === 'ar' ? review.commentAr : review.comment;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true, margin: "-50px" }}
      className="border-l border-primary/30 pl-6 py-2 group"
    >
      <Quote className="w-5 h-5 text-primary/30 mb-4" />
      
      <p className="text-foreground/80 text-sm leading-relaxed mb-6 italic font-light">
        "{comment}"
      </p>
      
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-foreground">{review.name}</h4>
          <StarRating rating={review.rating} />
        </div>
      </div>
    </motion.div>
  );
}

export function ReviewsSection() {
  const { language, t } = useLanguage();
  
  const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

  return (
    <section className="py-20 border-t border-border/30">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <p className="text-primary text-xs uppercase tracking-[0.3em] mb-3">
            {language === 'ar' ? 'آراء الضيوف' : 'Guest Reviews'}
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            {language === 'ar' ? 'ماذا يقول ضيوفنا' : 'What Our Guests Say'}
          </h2>
          <div className="w-16 h-0.5 bg-primary" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {reviews.map((review, index) => (
            <ReviewCard key={review.id} review={review} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
