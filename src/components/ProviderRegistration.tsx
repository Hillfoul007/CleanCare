
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserCog, Mail, Phone, MapPin, Briefcase, Upload, CheckCircle, LogIn } from 'lucide-react';

const ProviderRegistration = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [providerData, setProviderData] = useState(null);
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });
  
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    specialty: 'Cleaning',
    experience: '',
    hourlyRate: '',
    bio: '',
    profileImage: null,
  });

  useEffect(() => {
    // Check if provider is already logged in
    const loggedInProvider = localStorage.getItem('providerData');
    if (loggedInProvider) {
      setProviderData(JSON.parse(loggedInProvider));
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginChange = (e) => {
    setLoginForm({
      ...loginForm,
      [e.target.id]: e.target.value
    });
  };

  const handleRegistrationChange = (e) => {
    setRegistrationForm({
      ...registrationForm,
      [e.target.id]: e.target.value
    });
  };

  const handleSpecialtyChange = (value) => {
    setRegistrationForm({
      ...registrationForm,
      specialty: value
    });
  };

  const handleProfileImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      // In a real app, we would upload this to a server
      // Here we'll just store it as a data URL for demo
      const reader = new FileReader();
      reader.onload = (event) => {
        setRegistrationForm({
          ...registrationForm,
          profileImage: event.target.result
        });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    
    // In a real app, this would validate against a backend
    // For demo, we'll check if the provider exists in localStorage
    const providers = JSON.parse(localStorage.getItem('serviceProviders') || '[]');
    const provider = providers.find(p => p.email === loginForm.email && p.password === loginForm.password);
    
    if (provider) {
      localStorage.setItem('providerData', JSON.stringify(provider));
      setProviderData(provider);
      setIsLoggedIn(true);
      alert("Login successful!");
    } else {
      alert("Invalid email or password.");
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    
    if (registrationForm.password !== registrationForm.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    // Generate a unique ID
    const newProvider = {
      id: Date.now(),
      name: registrationForm.name,
      email: registrationForm.email,
      password: registrationForm.password, // In a real app, this would be hashed
      phone: registrationForm.phone,
      address: registrationForm.address,
      specialty: registrationForm.specialty,
      experience: registrationForm.experience,
      price: parseInt(registrationForm.hourlyRate, 10) || 25,
      bio: registrationForm.bio,
      image: registrationForm.profileImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      rating: 0,
      reviews: 0,
    };

    // Get existing providers
    const providers = JSON.parse(localStorage.getItem('serviceProviders') || '[]');
    
    // Check if email already exists
    if (providers.some(p => p.email === registrationForm.email)) {
      alert("Email already registered. Please use a different email.");
      return;
    }
    
    // Add new provider
    providers.push(newProvider);
    
    // Save to localStorage
    localStorage.setItem('serviceProviders', JSON.stringify(providers));
    localStorage.setItem('providerData', JSON.stringify(newProvider));
    
    setProviderData(newProvider);
    setIsLoggedIn(true);
    alert("Registration successful!");
  };

  const handleLogout = () => {
    localStorage.removeItem('providerData');
    setProviderData(null);
    setIsLoggedIn(false);
  };

  if (isLoggedIn && providerData) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6 mb-6">
          <div className="flex items-center space-x-4 mb-6">
            <img 
              src={providerData.image} 
              alt={providerData.name} 
              className="w-20 h-20 rounded-full object-cover border-2 border-blue-300" 
            />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{providerData.name}</h2>
              <p className="text-blue-600 font-semibold">{providerData.specialty}</p>
              <div className="mt-1 text-sm text-gray-500">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  <span>{providerData.email}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Service Details</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <Briefcase className="w-4 h-4 mr-2 text-blue-600" />
                <span className="font-medium">Specialty:</span>
                <span className="ml-2">{providerData.specialty}</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                <span className="font-medium">Experience:</span>
                <span className="ml-2">{providerData.experience || 'Not specified'}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium">Hourly Rate:</span>
                <span className="ml-2 text-green-600 font-semibold">${providerData.price}/hr</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Contact Information</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2 text-blue-600" />
                <span className="font-medium">Phone:</span>
                <span className="ml-2">{providerData.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                <span className="font-medium">Address:</span>
                <span className="ml-2">{providerData.address || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {providerData.bio && (
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">About Me</h3>
              <p className="text-gray-600">{providerData.bio}</p>
            </div>
          )}

          <div className="text-center mt-6">
            <p className="mb-2 text-sm text-gray-500">
              You are currently logged in as a service provider. Your profile is visible to potential clients.
            </p>
            <Button 
              onClick={handleLogout}
              variant="outline" 
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Log Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-4 rounded-full">
            <UserCog className="w-12 h-12 text-blue-600" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Service Provider Portal
        </h2>
        
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`flex-1 text-center py-2 font-medium ${isLogin ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            className={`flex-1 text-center py-2 font-medium ${!isLogin ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>
        
        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                value={loginForm.email}
                onChange={handleLoginChange}
                required
                className="mt-1 rounded-lg border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                required
                className="mt-1 rounded-lg border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-2 rounded-lg"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login as Provider
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-gray-700">Full Name</Label>
                <Input
                  id="name"
                  value={registrationForm.name}
                  onChange={handleRegistrationChange}
                  required
                  className="mt-1 rounded-lg border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={registrationForm.email}
                  onChange={handleRegistrationChange}
                  required
                  className="mt-1 rounded-lg border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={registrationForm.password}
                  onChange={handleRegistrationChange}
                  required
                  className="mt-1 rounded-lg border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="confirmPassword" className="text-gray-700">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={registrationForm.confirmPassword}
                  onChange={handleRegistrationChange}
                  required
                  className="mt-1 rounded-lg border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="text-gray-700">Phone Number</Label>
                <Input
                  id="phone"
                  value={registrationForm.phone}
                  onChange={handleRegistrationChange}
                  className="mt-1 rounded-lg border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="specialty" className="text-gray-700">Specialty</Label>
                <Select 
                  onValueChange={handleSpecialtyChange}
                  defaultValue={registrationForm.specialty}
                >
                  <SelectTrigger className="mt-1 rounded-lg border-blue-200">
                    <SelectValue placeholder="Select a specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cleaning">Cleaning</SelectItem>
                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Carpentry">Carpentry</SelectItem>
                    <SelectItem value="Painting">Painting</SelectItem>
                    <SelectItem value="Gardening">Gardening</SelectItem>
                    <SelectItem value="General Repairs">General Repairs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experience" className="text-gray-700">Years of Experience</Label>
                <Input
                  id="experience"
                  value={registrationForm.experience}
                  onChange={handleRegistrationChange}
                  className="mt-1 rounded-lg border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="hourlyRate" className="text-gray-700">Hourly Rate ($)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  min="0"
                  value={registrationForm.hourlyRate}
                  onChange={handleRegistrationChange}
                  className="mt-1 rounded-lg border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="address" className="text-gray-700">Address</Label>
              <Input
                id="address"
                value={registrationForm.address}
                onChange={handleRegistrationChange}
                className="mt-1 rounded-lg border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <Label htmlFor="bio" className="text-gray-700">Bio (Tell clients about yourself)</Label>
              <Textarea
                id="bio"
                value={registrationForm.bio}
                onChange={handleRegistrationChange}
                className="mt-1 rounded-lg border-blue-200 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
              />
            </div>
            
            <div>
              <Label htmlFor="profileImage" className="text-gray-700">Profile Image</Label>
              <div className="mt-1 flex items-center">
                {registrationForm.profileImage ? (
                  <div className="mr-4">
                    <img
                      src={registrationForm.profileImage}
                      alt="Profile Preview"
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  </div>
                ) : null}
                <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 px-4 rounded-lg flex items-center transition duration-300">
                  <Upload className="w-4 h-4 mr-2" />
                  <span>Upload Image</span>
                  <input
                    id="profileImage"
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-2 rounded-lg"
            >
              Register as Service Provider
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProviderRegistration;
