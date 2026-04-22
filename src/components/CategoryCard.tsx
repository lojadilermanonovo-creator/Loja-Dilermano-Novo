import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    imageUrl?: string;
  };
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  return (
    <Link to={`/categoria/${category.id}`}>
      <motion.div 
        className="group relative aspect-square overflow-hidden rounded-2xl bg-surface-elevated"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <img 
          src={category.imageUrl || "https://images.unsplash.com/photo-1523381235312-3a1683935450?q=80&w=2070&auto=format&fit=crop"} 
          alt={category.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <span className="text-sm font-bold text-white uppercase tracking-wider">{category.name}</span>
        </div>
      </motion.div>
    </Link>
  );
};

export default CategoryCard;
