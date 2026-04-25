import React, { useContext } from 'react';
import type { Vendor } from '../types';
import { StarIcon, LocationMarkerIcon } from './Icons';
import { AppContext } from '../context/AppContext';

interface VendorCardProps {
  vendor: Vendor;
}

const VendorCard: React.FC<VendorCardProps> = ({ vendor }) => {
  const { navigateTo } = useContext(AppContext);

  return (
    <button
      onClick={() => navigateTo('vendorDetail', vendor)}
      className="flex bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 w-full text-left"
    >
      <img className="w-1/3 h-auto object-cover" src={vendor.image} alt={vendor.businessName} />
      <div className="w-2/3 p-4 flex flex-col justify-between">
        <div>
          <div className="uppercase tracking-wide text-sm text-primary font-bold">{vendor.foodType}</div>
          <h3 className="block mt-1 text-lg leading-tight font-medium text-black">{vendor.businessName}</h3>
        </div>
        <div className="mt-2 flex items-center justify-between text-gray-500">
          <div className="flex items-center">
            <StarIcon className="w-5 h-5 text-secondary" />
            <span className="ml-1 font-semibold">{vendor.rating.toFixed(1)}</span>
             <span className="ml-2 text-sm">({vendor.reviews?.length || 0} reviews)</span>
          </div>
          <div className="flex items-center text-sm">
            <LocationMarkerIcon className="w-4 h-4 mr-1 text-gray-400"/>
            <span>0.5 km</span>
          </div>
        </div>
      </div>
    </button>
  );
};

export default VendorCard;