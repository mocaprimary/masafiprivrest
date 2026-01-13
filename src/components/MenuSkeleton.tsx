import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MenuSkeletonProps {
  count?: number;
}

export function MenuItemSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative overflow-hidden rounded-xl bg-card border border-border/50"
    >
      {/* Image skeleton */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </div>
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="h-5 bg-muted rounded w-2/3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-transparent via-white/5 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.1 }}
            />
          </div>
          <div className="h-5 bg-muted rounded w-16 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-transparent via-white/5 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.2 }}
            />
          </div>
        </div>
        <div className="h-4 bg-muted rounded w-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-transparent via-white/5 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.3 }}
          />
        </div>
        <div className="h-4 bg-muted rounded w-3/4 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-transparent via-white/5 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.4 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export function MenuSkeleton({ count = 6 }: MenuSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <MenuItemSkeleton key={i} />
      ))}
    </div>
  );
}

export function CategoryTabsSkeleton() {
  return (
    <div className="flex gap-2 pb-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="h-10 bg-muted rounded-full w-24 overflow-hidden"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-transparent via-white/5 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: i * 0.1 }}
          />
        </motion.div>
      ))}
    </div>
  );
}
