
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import StarRating from './StarRating';
import { MapPin, Filter, Star, Clock, Shield } from 'lucide-react';

const ProviderList = ({ service, onProviderSelect, onViewReviews }) => {
  const [providers, setProviders] = useState([]);
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const registeredProviders = JSON.parse(localStorage.getItem('serviceProviders') || '[]');
    
    const filteredProviders = registeredProviders.filter(provider => {
      if (!service || service === 'all') return true;
      return provider.specialty && provider.specialty.toLowerCase() === service.toLowerCase();
    });
    
    console.log('Service:', service);
    console.log('Registered providers:', registeredProviders);
    console.log('Filtered providers:', filteredProviders);
    
    setProviders(filteredProviders);
  }, [service]);

  const sortProviders = (providers, sortBy) => {
    return [...providers].sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'price':
          return (a.price || 0) - (b.price || 0);
        case 'experience':
          return (b.experience || 0) - (a.experience || 0);
        default:
          return 0;
      }
    });
  };

  const sortedProviders = sortProviders(providers, sortBy);

  if (providers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Service Header */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                  <span className="text-xl text-white">🔧</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 capitalize">{service}</h2>
                  <p className="text-gray-600">Professional services</p>
                </div>
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-300"
              >
                <Filter className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700 font-medium">Filters</span>
              </button>
            </div>
          </div>
          
          {/* Empty State */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🔍</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Pros Available</h3>
            <p className="text-gray-600 mb-6">We don't have any service providers for {service} yet.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <p className="text-blue-800 font-medium">💡 Be the first!</p>
              <p className="text-blue-700 text-sm mt-1">Join as a service provider and start earning today.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Service Header */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                <span className="text-xl text-white">🔧</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 capitalize">{service}</h2>
                <p className="text-gray-600">{providers.length} professionals available</p>
              </div>
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-300 hover:scale-105"
            >
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-gray-700 font-medium">Sort & Filter</span>
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setSortBy('rating')}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    sortBy === 'rating' 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Highest Rated
                </button>
                <button
                  onClick={() => setSortBy('price')}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    sortBy === 'price' 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Lowest Price
                </button>
                <button
                  onClick={() => setSortBy('experience')}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    sortBy === 'experience' 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Most Experienced
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Provider Cards */}
        <div className="space-y-4 mb-8">
          {sortedProviders.map((provider, index) => (
            <div 
              key={provider.id} 
              className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-6">
                  {/* Provider Image */}
                  <div className="relative">
                    <img
                      src={provider.image}
                      alt={provider.name}
                      className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-2 border-gray-100 group-hover:border-blue-200 transition-all duration-300"
                    />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                      <Shield className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  
                  {/* Provider Info */}
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{provider.name}</h3>
                        <p className="text-gray-600 font-medium capitalize">{provider.specialty}</p>
                      </div>
                      <div className="mt-2 md:mt-0 text-right">
                        <div className="text-2xl font-bold text-blue-600">${provider.price}</div>
                        <div className="text-gray-500 text-sm">per hour</div>
                      </div>
                    </div>
                    
                    {/* Rating and Experience */}
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <StarRating rating={provider.rating || 4.5} />
                        <span className="text-gray-700 font-medium">({provider.rating || 4.5})</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{provider.experience || 3}+ years</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{provider.location || 'Downtown'}</span>
                      </div>
                    </div>

                    {/* Provider Description */}
                    {provider.bio && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{provider.bio}</p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        onClick={() => onProviderSelect(provider)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                      >
                        Book Now
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={() => onViewReviews(provider)}
                        className="flex-1 border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
                      >
                        View Reviews
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl shadow-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-3">Can't find what you're looking for?</h3>
          <p className="text-blue-100 mb-6">Post your requirement and let pros come to you!</p>
          <Button className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg">
            Post Your Requirement
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProviderList;
