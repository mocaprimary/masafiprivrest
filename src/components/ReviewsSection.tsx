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
          className={`w-3.5 h-3.5 ${
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
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true, margin: "-40px" }}
      className="bg-card rounded-2xl p-6 border border-border/40 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 relative"
    >
      <Quote className="absolute top-5 right-5 w-7 h-7 text-primary/10" />
      
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
          <span className="text-primary font-bold text-sm">
            {review.name.charAt(0)}
          </span>
        </div>
        <div>
          <h4 className="font-semibold text-foreground text-sm">{review.name}</h4>
          <StarRating rating={review.rating} />
        </div>
      </div>
      
      <p className="text-muted-foreground text-sm leading-relaxed">
        "{comment}"
      </p>
    </motion.div>
  );
}

export function ReviewsSection() {
  const { language } = useLanguage();
  
  const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-primary text-sm uppercase tracking-[0.3em] mb-3 font-medium">
            {language === 'ar' ? 'آراء الضيوف' : 'Guest Reviews'}
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
            {language === 'ar' ? 'ماذا يقول ضيوفنا' : 'What Our Guests Say'}
          </h2>
          
          <div className="flex items-center justify-center gap-3">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(averageRating)
                      ? 'fill-primary text-primary'
                      : 'fill-muted text-muted'
                  }`}
                />
              ))}
            </div>
            <span className="text-foreground font-bold text-lg">{averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground text-sm">
              ({reviews.length} {language === 'ar' ? 'تقييمات' : 'reviews'})
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {reviews.map((review, index) => (
            <ReviewCard key={review.id} review={review} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
