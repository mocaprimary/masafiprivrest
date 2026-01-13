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
    name: 'Sarah M.',
    rating: 5,
    comment: 'The lamb shank was absolutely divine! Best Middle Eastern cuisine I\'ve had in the city. The ambiance is perfect for a special evening.',
    commentAr: 'كان لحم الضأن لذيذًا للغاية! أفضل مطبخ شرق أوسطي تناولته في المدينة. الأجواء مثالية لأمسية خاصة.',
    date: '2024-12-15',
  },
  {
    id: '2',
    name: 'Ahmed K.',
    rating: 5,
    comment: 'Authentic flavors that remind me of home. The hummus trio is a must-try, and the kunafa dessert is heavenly.',
    commentAr: 'نكهات أصيلة تذكرني بالوطن. طبق الحمص الثلاثي لا بد من تجربته، وحلوى الكنافة رائعة.',
    date: '2024-12-10',
  },
  {
    id: '3',
    name: 'Emily R.',
    rating: 4,
    comment: 'Beautiful restaurant with exceptional service. The grilled hammour was cooked to perfection. Will definitely return!',
    commentAr: 'مطعم جميل مع خدمة استثنائية. كان سمك الهامور المشوي مطهوًا بإتقان. سأعود بالتأكيد!',
    date: '2024-12-05',
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
