export interface Coordinates {
  lat: number;
  lng: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number; // 1-5
  comment: string;
  date: string;
}

export interface Vendor {
  id: string;
  name: string; // This will be the user's name
  businessName: string;
  foodType: string;
  coords: Coordinates;
  rating: number;
  image: string;
  menu?: MenuItem[];
  reviews?: Review[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status?: 'approved' | 'pending';
}

export type Role = 'USER' | 'VENDOR' | 'ADMIN';

export type View = 'home' | 'auth' | 'userDashboard' | 'vendorDashboard' | 'adminDashboard' | 'vendorDetail';