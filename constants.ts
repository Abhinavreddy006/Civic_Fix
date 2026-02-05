
import { RoutingMap } from './types';

export const LOCATIONS: string[] = [
    "Anurag University", "Abids", "Adikmet", "Afzal Gunj", "Amberpet", "Ameerpet", "Attapur",
    "Bachupally", "Balanagar", "Banjara Hills", "Begumpet", "Bowenpally",
    "Chanda Nagar", "Charminar", "Chintal", "Cyber Towers",
    "Dilsukhnagar", "Domalguda",
    "Ecil X Roads", "Erragadda",
    "Film Nagar",
    "Gachibowli", "Ghatkesar", "Golconda", "Gudimalkapur",
    "Habsiguda", "Hafeezpet", "Hasmathpet", "Himayatnagar", "Hitech City",
    "JBS (Jubilee Bus Station)", "Jedimetla", "Jubilee Hills",
    "Kacheguda", "Kukatpally", "Kompally", "Kothapet", "Koti",
    "Lakdikapul", "LB Nagar", "Lingampally",
    "Madhapur", "Madinaguda", "Malakpet", "Malkajgiri", "Manikonda", "Marredpally", "Masab Tank", "Medchal", "Mehdipatnam", "Miyapur", "Moosapet",
    "Nagole", "Nampally", "Narayanguda", "Nizampet",
    "Old City", "Osmania University",
    "Panjagutta", "Paradise", "Patancheru", "Pragathi Nagar", "Punjagutta",
    "Raidurg", "Ramanthapur", "Ramnagar", "RTC X Roads",
    "Sainikpuri", "Sanathnagar", "Santosh Nagar", "Secunderabad Station", "Serilingampally", "Shaikpet", "Shamshabad", "Somajiguda", "SR Nagar",
    "Tarnaka", "Tolichowki",
    "Uppal", "Uppal X Roads",
    "Vanasthalipuram",
    "Warasiguda",
    "Yousufguda",
    "Other (Type Manually)"
];

export const ROUTING_MAP: RoutingMap = {
  "Anurag University": "@GhatkesarMuncipal",
  "Uppal X Roads": "@GHMCOnline",
  "Secunderabad Station": "@SCB_India",
  "Ghatkesar": "@GhatkesarMuncipal",
  "default": "@GHMCOnline"
};

// --- HYDERABAD CIVIC AUTHORITY DATABASE (2025-26) ---
export const CIVIC_DIRECTORY = {
  "GHMC (Roads & Garbage)": {
    "default": "commissioner-ghmc@gov.in",
    "zones": {
      "Secunderabad Station": "zc_secunderabad@ghmc.gov.in",
      "Kukatpally": "zc_kukatpally@ghmc.gov.in",
      "LB Nagar": "zc_lbnagar@ghmc.gov.in",
      "Charminar": "zc_charminar@ghmc.gov.in",
      "Anurag University": "commissioner.ghatkesar@gmail.com",
      "Ghatkesar": "commissioner.ghatkesar@gmail.com"
    }
  },
  "HMWSSB (Water & Sewage)": {
    "default": "customer-support@hmwssb.in",
    "emergency": "md@hmwssb.in"
  },
  "TSSPDCL (Electricity)": {
    "default": "customerservice@tssouthernpower.com",
    "zones": {
      "Secunderabad Station": "se_secunderabad@tssouthernpower.com",
      "Cyber City": "se_cybercity@tssouthernpower.com",
      "Anurag University": "ae_ghatkesar@tssouthernpower.com",
      "Ghatkesar": "ae_ghatkesar@tssouthernpower.com"
    }
  },
  "Traffic Police": {
    "default": "trf.hyd@gmail.com"
  }
};

export const MAX_IMAGE_WIDTH = 800;
