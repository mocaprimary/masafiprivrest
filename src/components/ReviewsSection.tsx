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
          className={`w-4 h-4 ${
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
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: index * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -5, transition: { duration: 0.3 } }}
      className="bg-card border border-border/50 rounded-xl p-6 relative group"
    >
      <motion.div
        initial={{ opacity: 0, rotate: -20 }}
        whileInView={{ opacity: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.15 + 0.3, type: "spring", stiffness: 200 }}
      >
        <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20 group-hover:text-primary/40 transition-colors" />
      </motion.div>
      
      <div className="flex items-center gap-3 mb-4">
        <motion.div 
          className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.15 + 0.2, type: "spring", stiffness: 300 }}
        >
          <span className="text-primary font-semibold text-sm">
            {review.name.charAt(0)}
          </span>
        </motion.div>
        <div>
          <h4 className="font-medium text-foreground">{review.name}</h4>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.15 + 0.25 }}
          >
            <StarRating rating={review.rating} />
          </motion.div>
        </div>
      </div>
      
      <motion.p 
        className="text-muted-foreground text-sm leading-relaxed"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.15 + 0.35 }}
      >
        "{comment}"
      </motion.p>
    </motion.div>
  );
}

export function ReviewsSection() {
  const { language, t } = useLanguage();
  
  const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

  return (
    <section className="py-16 bg-card/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-muted-foreground text-sm uppercase tracking-[0.2em] mb-2">
            {language === 'ar' ? 'آراء الضيوف' : 'Guest Reviews'}
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            {language === 'ar' ? 'ماذا يقول ضيوفنا' : 'What Our Guests Say'}
          </h2>
          
          <motion.div 
            className="flex items-center justify-center gap-2"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star, i) => (
                <motion.div
                  key={star}
                  initial={{ opacity: 0, scale: 0, rotate: -180 }}
                  whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.1, type: "spring", stiffness: 200 }}
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= Math.round(averageRating)
                        ? 'fill-primary text-primary'
                        : 'fill-muted text-muted'
                    }`}
                  />
                </motion.div>
              ))}
            </div>
            <span className="text-foreground font-semibold">{averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground text-sm">
              ({reviews.length} {language === 'ar' ? 'تقييمات' : 'reviews'})
            </span>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <ReviewCard key={review.id} review={review} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
