export interface LaundryService {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  unit: string;
  description?: string;
  minQuantity?: number;
  icon?: string;
  image?: string;
  popular?: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  services: LaundryService[];
}

export const laundryServices: ServiceCategory[] = [
  {
    id: "wash-fold",
    name: "Wash & Fold",
    icon: "👕",
    color: "from-blue-500 to-blue-600",
    description: "Professional washing and folding service",
    services: [
      {
        id: "wf-regular",
        name: "Laundry and Fold",
        category: "Wash & Fold",
        price: 70,
        unit: "per kg",
        description: "Regular wash and fold service",
        minQuantity: 1,
        popular: true,
      },
      {
        id: "wf-bulk",
        name: "Laundry and Fold (Bulk)",
        category: "Wash & Fold",
        price: 60,
        unit: "per kg",
        description: "Bulk pricing for 3kg and above",
        minQuantity: 3,
      },
    ],
  },
  {
    id: "wash-iron",
    name: "Wash & Iron",
    icon: "🏷️",
    color: "from-green-500 to-green-600",
    description: "Washing with professional ironing",
    services: [
      {
        id: "wi-regular",
        name: "Laundry and Iron",
        category: "Wash & Iron",
        price: 120,
        unit: "per kg",
        description: "Professional wash and iron service",
        minQuantity: 1,
        popular: true,
      },
      {
        id: "wi-bulk",
        name: "Laundry and Iron (Bulk)",
        category: "Wash & Iron",
        price: 110,
        unit: "per kg",
        description: "Bulk pricing for 3kg and above",
        minQuantity: 3,
      },
    ],
  },
  {
    id: "steam-iron",
    name: "Steam Iron Only",
    icon: "🔥",
    color: "from-orange-500 to-orange-600",
    description: "Professional steam ironing service",
    services: [
      {
        id: "si-premium",
        name: "Premium Items (Steam Iron)",
        category: "Steam Iron",
        subcategory: "Premium",
        price: 50,
        unit: "per piece",
        description: "Coat, Lehenga, Sweatshirt, Sweater, Achkan",
        popular: true,
      },
      {
        id: "si-regular",
        name: "Regular Items (Steam Iron)",
        category: "Steam Iron",
        subcategory: "Regular",
        price: 30,
        unit: "per piece",
        description: "All other garments",
      },
    ],
  },
  {
    id: "mens-dry-clean",
    name: "Men's Dry Clean",
    icon: "👔",
    color: "from-purple-500 to-purple-600",
    description: "Professional dry cleaning for men's wear",
    services: [
      {
        id: "mdc-shirt",
        name: "Shirt/T-Shirt",
        category: "Men's Dry Clean",
        price: 90,
        unit: "per piece",
        description: "Professional dry cleaning for shirts",
        popular: true,
      },
      {
        id: "mdc-trouser",
        name: "Trouser/Jeans",
        category: "Men's Dry Clean",
        price: 120,
        unit: "per piece",
        description: "Dry cleaning for trousers and jeans",
      },
      {
        id: "mdc-coat",
        name: "Coat",
        category: "Men's Dry Clean",
        price: 220,
        unit: "per piece",
        description: "Professional coat dry cleaning",
      },
      {
        id: "mdc-suit-2pc",
        name: "Men's Suit (2 Piece)",
        category: "Men's Dry Clean",
        price: 330,
        unit: "per set",
        description: "Complete 2-piece suit cleaning",
      },
      {
        id: "mdc-suit-3pc",
        name: "Men's Suit (3 Piece)",
        category: "Men's Dry Clean",
        price: 380,
        unit: "per set",
        description: "Complete 3-piece suit cleaning",
      },
      {
        id: "mdc-kurta-pajama",
        name: "Kurta Pyjama Set",
        category: "Men's Dry Clean",
        price: 220,
        unit: "per set",
        description: "Traditional kurta pyjama set",
      },
      {
        id: "mdc-achkan",
        name: "Achkan",
        category: "Men's Dry Clean",
        price: 380,
        unit: "per piece",
        description: "Traditional achkan dry cleaning",
      },
    ],
  },
  {
    id: "womens-dry-clean",
    name: "Women's Dry Clean",
    icon: "👗",
    color: "from-pink-500 to-pink-600",
    description: "Specialized dry cleaning for women's wear",
    services: [
      {
        id: "wdc-kurta",
        name: "Kurta",
        category: "Women's Dry Clean",
        price: 140,
        unit: "per piece",
        description: "Professional kurta dry cleaning",
        popular: true,
      },
      {
        id: "wdc-salwar",
        name: "Salwar/Plazo/Dupatta",
        category: "Women's Dry Clean",
        price: 120,
        unit: "per piece",
        description: "Bottom wear and dupatta cleaning",
      },
      {
        id: "wdc-saree-simple",
        name: "Saree (Simple/Silk)",
        category: "Women's Dry Clean",
        price: 210,
        unit: "per piece",
        description: "Regular and silk saree cleaning",
      },
      {
        id: "wdc-saree-heavy",
        name: "Saree (Heavy Work)",
        category: "Women's Dry Clean",
        price: 350,
        unit: "per piece",
        description: "Heavy work saree with embellishments",
      },
      {
        id: "wdc-blouse",
        name: "Blouse",
        category: "Women's Dry Clean",
        price: 90,
        unit: "per piece",
        description: "Blouse dry cleaning",
      },
      {
        id: "wdc-dress",
        name: "Dress",
        category: "Women's Dry Clean",
        price: 330,
        unit: "per piece",
        description: "Western dress dry cleaning",
      },
      {
        id: "wdc-top",
        name: "Top",
        category: "Women's Dry Clean",
        price: 100,
        unit: "per piece",
        description: "Top/shirt dry cleaning",
      },
      {
        id: "wdc-skirt",
        name: "Skirt (Heavy)",
        category: "Women's Dry Clean",
        price: 200,
        unit: "per piece",
        description: "Heavy skirt dry cleaning",
      },
      {
        id: "wdc-lehenga-1pc",
        name: "Lehenga (1 Piece)",
        category: "Women's Dry Clean",
        price: 330,
        unit: "per piece",
        description: "Single piece lehenga",
      },
      {
        id: "wdc-lehenga-2pc",
        name: "Lehenga (2+ Pieces)",
        category: "Women's Dry Clean",
        price: 450,
        unit: "per set",
        description: "Multi-piece lehenga set",
        popular: true,
      },
      {
        id: "wdc-lehenga-heavy",
        name: "Lehenga (Heavy Work)",
        category: "Women's Dry Clean",
        price: 700,
        unit: "per set",
        description: "Heavy work lehenga with intricate details",
      },
    ],
  },
  {
    id: "woolen-dry-clean",
    name: "Woolen Dry Clean",
    icon: "🧥",
    color: "from-indigo-500 to-indigo-600",
    description: "Specialized care for woolen and winter wear",
    services: [
      {
        id: "wol-jacket",
        name: "Jacket (Full/Half Sleeves)",
        category: "Woolen Dry Clean",
        price: 300,
        unit: "per piece",
        description: "Professional jacket cleaning",
        popular: true,
      },
      {
        id: "wol-sweater",
        name: "Sweater/Sweatshirt",
        category: "Woolen Dry Clean",
        price: 200,
        unit: "per piece",
        description: "Sweater and sweatshirt care",
      },
      {
        id: "wol-long-coat",
        name: "Long Coat",
        category: "Woolen Dry Clean",
        price: 400,
        unit: "per piece",
        description: "Long winter coat cleaning",
      },
      {
        id: "wol-shawl",
        name: "Shawl",
        category: "Woolen Dry Clean",
        price: 250,
        unit: "per piece",
        description: "Delicate shawl cleaning",
      },
      {
        id: "wol-pashmina",
        name: "Pashmina",
        category: "Woolen Dry Clean",
        price: 550,
        unit: "per piece",
        description: "Premium pashmina care",
      },
      {
        id: "wol-leather",
        name: "Leather Jacket",
        category: "Woolen Dry Clean",
        price: 600,
        unit: "per piece",
        description: "Specialized leather jacket cleaning",
      },
    ],
  },
];

// Helper functions
export const getServiceById = (id: string): LaundryService | undefined => {
  for (const category of laundryServices) {
    const service = category.services.find((s) => s.id === id);
    if (service) return service;
  }
  return undefined;
};

export const getServicesByCategory = (categoryId: string): LaundryService[] => {
  const category = laundryServices.find((c) => c.id === categoryId);
  return category ? category.services : [];
};

export const getPopularServices = (): LaundryService[] => {
  const popular: LaundryService[] = [];
  laundryServices.forEach((category) => {
    popular.push(...category.services.filter((s) => s.popular));
  });
  // Sort popular services alphabetically
  return popular.sort((a, b) => a.name.localeCompare(b.name));
};

export const getSortedServices = (): LaundryService[] => {
  const allServices: LaundryService[] = [];
  laundryServices.forEach((category) => {
    allServices.push(...category.services);
  });

  // Separate popular and regular services
  const popular = allServices
    .filter((s) => s.popular)
    .sort((a, b) => a.name.localeCompare(b.name));
  const regular = allServices
    .filter((s) => !s.popular)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Return popular first, then regular
  return [...popular, ...regular];
};

export const searchServices = (query: string): LaundryService[] => {
  const searchTerm = query.toLowerCase();
  const results: LaundryService[] = [];

  laundryServices.forEach((category) => {
    category.services.forEach((service) => {
      if (
        service.name.toLowerCase().includes(searchTerm) ||
        service.category.toLowerCase().includes(searchTerm) ||
        service.description?.toLowerCase().includes(searchTerm)
      ) {
        results.push(service);
      }
    });
  });

  return results;
};
