
import React from 'react';
import { Button } from '@/components/ui/button';
import StarRating from './StarRating';

const Reviews = ({ provider }) => {
  const reviews = [
    {
      id: 1,
      name: 'Courtney Henry',
      date: 'Jul 20, 2023',
      rating: 5,
      comment: 'Jenny did an excellent job, cleaning my apartment. Highly recommend!',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face'
    },
    {
      id: 2,
      name: 'Theresa Webb',
      date: 'Jun 10, 2023',
      rating: 5,
      comment: 'Fantastic service and very professional!',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c5cd?w=40&h=40&fit=crop&crop=face'
    }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center space-x-4 mb-8">
        <img
          src={provider.image}
          alt={provider.name}
          className="w-16 h-16 rounded-full object-cover"
        />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{provider.name}</h2>
          <StarRating rating={provider.rating} size="lg" />
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recommends</h3>
        <span className="text-2xl font-bold text-gray-900">50</span>
      </div>

      <div className="space-y-6 mb-8">
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-gray-200 pb-6">
            <div className="flex items-start space-x-3 mb-3">
              <img
                src={review.avatar}
                alt={review.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-gray-900">{review.name}</h4>
                  <span className="text-sm text-gray-500">{review.date}</span>
                </div>
                <StarRating rating={review.rating} />
                <span className="text-sm text-gray-500 ml-2">$0</span>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed">{review.comment}</p>
          </div>
        ))}
      </div>

      <Button 
        variant="outline" 
        className="w-full border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50"
      >
        Write a Review
      </Button>
    </div>
  );
};

export default Reviews;
