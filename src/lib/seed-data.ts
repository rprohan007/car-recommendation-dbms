export interface SeedVariant {
  variant_id: number;
  variant_name: string;
  model_id: number;
  model_name: string;
  manufacturer_name: string;
  country_origin: string;
  body_type: string;
  seating_capacity: number;
  ex_showroom_price: number;
  fuel_type: string;
  transmission: string;
  engine_displacement_cc: number | null;
  power_bhp: number;
  torque_nm: number;
  mileage_kmpl: number;
  safety_rating_ncap: number;
  is_active: boolean;
  standard_features: string[];
  optional_features?: string[];
  features_list?: {
    feature_id: number;
    feature_name: string;
    category: string;
    is_standard: boolean;
  }[];
  similarity_score?: number;
  combined_relevance_score?: number;
}

export interface UpcomingLaunch {
  model_id: number;
  model_name: string;
  manufacturer_name: string;
  country_origin: string;
  body_type: string;
  seating_capacity: number;
  expected_launch_date: string;
  days_until_launch: number;
  launch_status: string;
  announced_variants_count: number;
  estimated_starting_price: number;
  estimated_top_price: number;
  highlight_features?: string[];
  battery_or_engine?: string;
}

export interface CarModelSeed {
  model_id: number;
  manufacturer_id: number;
  manufacturer_name: string;
  model_name: string;
  body_type: string;
  launch_status: string;
  expected_launch_date: string | null;
  seating_capacity: number;
}

export const SEED_MODELS: CarModelSeed[] = [
  { model_id: 1, manufacturer_id: 1, manufacturer_name: 'Tata Motors', model_name: 'Nexon', body_type: 'SUV', launch_status: 'launched', expected_launch_date: null, seating_capacity: 5 },
  { model_id: 2, manufacturer_id: 1, manufacturer_name: 'Tata Motors', model_name: 'Curvv EV', body_type: 'Coupe', launch_status: 'upcoming', expected_launch_date: '2026-12-10', seating_capacity: 5 },
  { model_id: 3, manufacturer_id: 1, manufacturer_name: 'Tata Motors', model_name: 'Altroz', body_type: 'Hatchback', launch_status: 'launched', expected_launch_date: null, seating_capacity: 5 },
  { model_id: 4, manufacturer_id: 2, manufacturer_name: 'Mahindra & Mahindra', model_name: 'XUV700', body_type: 'SUV', launch_status: 'launched', expected_launch_date: null, seating_capacity: 7 },
  { model_id: 5, manufacturer_id: 2, manufacturer_name: 'Mahindra & Mahindra', model_name: 'Thar', body_type: 'SUV', launch_status: 'launched', expected_launch_date: null, seating_capacity: 4 },
  { model_id: 6, manufacturer_id: 2, manufacturer_name: 'Mahindra & Mahindra', model_name: 'BE 6e', body_type: 'SUV', launch_status: 'upcoming', expected_launch_date: '2027-01-25', seating_capacity: 5 },
  { model_id: 7, manufacturer_id: 3, manufacturer_name: 'Hyundai Motor India', model_name: 'Creta', body_type: 'SUV', launch_status: 'launched', expected_launch_date: null, seating_capacity: 5 },
  { model_id: 8, manufacturer_id: 3, manufacturer_name: 'Hyundai Motor India', model_name: 'Verna', body_type: 'Sedan', launch_status: 'launched', expected_launch_date: null, seating_capacity: 5 },
  { model_id: 9, manufacturer_id: 3, manufacturer_name: 'Hyundai Motor India', model_name: 'Ioniq 7', body_type: 'SUV', launch_status: 'upcoming', expected_launch_date: '2027-04-15', seating_capacity: 7 },
  { model_id: 10, manufacturer_id: 4, manufacturer_name: 'Toyota Kirloskar Motor', model_name: 'Fortuner', body_type: 'SUV', launch_status: 'launched', expected_launch_date: null, seating_capacity: 7 },
  { model_id: 11, manufacturer_id: 4, manufacturer_name: 'Toyota Kirloskar Motor', model_name: 'Innova Hycross', body_type: 'MUV', launch_status: 'launched', expected_launch_date: null, seating_capacity: 7 },
  { model_id: 12, manufacturer_id: 4, manufacturer_name: 'Toyota Kirloskar Motor', model_name: 'Urban Cruiser EV', body_type: 'SUV', launch_status: 'upcoming', expected_launch_date: '2027-02-28', seating_capacity: 5 },
];

export const SEED_VARIANTS: SeedVariant[] = [
  {
    variant_id: 1,
    variant_name: 'Smart 1.2 Petrol 5MT',
    model_id: 1,
    model_name: 'Nexon',
    manufacturer_name: 'Tata Motors',
    country_origin: 'India',
    body_type: 'SUV',
    seating_capacity: 5,
    ex_showroom_price: 815000,
    fuel_type: 'Petrol',
    transmission: 'Manual',
    engine_displacement_cc: 1199,
    power_bhp: 118.2,
    torque_nm: 170.0,
    mileage_kmpl: 17.44,
    safety_rating_ncap: 5.0,
    is_active: true,
    standard_features: ['6 Airbags', 'Electronic Stability Program (ESP)', 'Hill Hold & Descent Control', 'ISOFIX Child Seat Mounts'],
  },
  {
    variant_id: 2,
    variant_name: 'Creative 1.5 Diesel 6AMT',
    model_id: 1,
    model_name: 'Nexon',
    manufacturer_name: 'Tata Motors',
    country_origin: 'India',
    body_type: 'SUV',
    seating_capacity: 5,
    ex_showroom_price: 1310000,
    fuel_type: 'Diesel',
    transmission: 'AMT',
    engine_displacement_cc: 1497,
    power_bhp: 113.4,
    torque_nm: 260.0,
    mileage_kmpl: 23.23,
    safety_rating_ncap: 5.0,
    is_active: true,
    standard_features: ['6 Airbags', 'Electronic Stability Program (ESP)', '10.25-inch HD Touchscreen', 'Wireless Android Auto & Apple CarPlay'],
  },
  {
    variant_id: 3,
    variant_name: 'Fearless Plus S 1.2 Petrol 7DCA',
    model_id: 1,
    model_name: 'Nexon',
    manufacturer_name: 'Tata Motors',
    country_origin: 'India',
    body_type: 'SUV',
    seating_capacity: 5,
    ex_showroom_price: 1480000,
    fuel_type: 'Petrol',
    transmission: 'DCT',
    engine_displacement_cc: 1199,
    power_bhp: 118.2,
    torque_nm: 170.0,
    mileage_kmpl: 17.01,
    safety_rating_ncap: 5.0,
    is_active: true,
    standard_features: [
      '6 Airbags', 'Electronic Stability Program (ESP)', '360-Degree Surround Camera',
      '10.25-inch HD Touchscreen', 'Wireless Android Auto & Apple CarPlay', 'JBL 9-Speaker Audio System',
      '10.25-inch Digital Cockpit', 'Panoramic Sunroof', 'Ventilated Front Seats',
      'Wireless Smartphone Charger', 'Air Purifier with AQI Display', 'Paddle Shifters', 'Blind Spot View Monitor'
    ],
  },
  {
    variant_id: 4,
    variant_name: 'EV Empowered Plus 45',
    model_id: 1,
    model_name: 'Nexon',
    manufacturer_name: 'Tata Motors',
    country_origin: 'India',
    body_type: 'SUV',
    seating_capacity: 5,
    ex_showroom_price: 1719000,
    fuel_type: 'Electric',
    transmission: 'Automatic',
    engine_displacement_cc: null,
    power_bhp: 142.6,
    torque_nm: 215.0,
    mileage_kmpl: 465.0, // Range km per charge
    safety_rating_ncap: 5.0,
    is_active: true,
    standard_features: [
      '6 Airbags', 'Electronic Stability Program (ESP)', '360-Degree Surround Camera',
      '10.25-inch HD Touchscreen', 'Wireless Android Auto & Apple CarPlay', 'JBL 9-Speaker Audio System',
      'Connected Car Tech (eSIM Telematics)', '10.25-inch Digital Cockpit', 'Panoramic Sunroof',
      'Ventilated Front Seats', 'Wireless Smartphone Charger', 'Electronic Parking Brake with Auto Hold',
      'Blind Spot View Monitor', 'Paddle Shifters'
    ],
  },
  {
    variant_id: 5,
    variant_name: 'MX 2.0 Turbo Petrol 6MT 5-Str',
    model_id: 4,
    model_name: 'XUV700',
    manufacturer_name: 'Mahindra & Mahindra',
    country_origin: 'India',
    body_type: 'SUV',
    seating_capacity: 5,
    ex_showroom_price: 1449000,
    fuel_type: 'Petrol',
    transmission: 'Manual',
    engine_displacement_cc: 1997,
    power_bhp: 197.13,
    torque_nm: 380.0,
    mileage_kmpl: 15.0,
    safety_rating_ncap: 5.0,
    is_active: true,
    standard_features: ['Electronic Stability Program (ESP)', 'ISOFIX Child Seat Mounts', 'Multi-Drive Modes (Eco/City/Sport)'],
  },
  {
    variant_id: 6,
    variant_name: 'AX5 2.0 Turbo Petrol 6AT 7-Str',
    model_id: 4,
    model_name: 'XUV700',
    manufacturer_name: 'Mahindra & Mahindra',
    country_origin: 'India',
    body_type: 'SUV',
    seating_capacity: 7,
    ex_showroom_price: 1899000,
    fuel_type: 'Petrol',
    transmission: 'Automatic',
    engine_displacement_cc: 1997,
    power_bhp: 197.13,
    torque_nm: 380.0,
    mileage_kmpl: 13.5,
    safety_rating_ncap: 5.0,
    is_active: true,
    standard_features: [
      '6 Airbags', 'Panoramic Sunroof', '10.25-inch HD Touchscreen', '10.25-inch Digital Cockpit',
      'Electronic Stability Program (ESP)', 'Hill Hold & Descent Control'
    ],
  },
  {
    variant_id: 7,
    variant_name: 'AX7 Luxury Pack 2.2 Diesel 6AT AWD 7-Str',
    model_id: 4,
    model_name: 'XUV700',
    manufacturer_name: 'Mahindra & Mahindra',
    country_origin: 'India',
    body_type: 'SUV',
    seating_capacity: 7,
    ex_showroom_price: 2699000,
    fuel_type: 'Diesel',
    transmission: 'Automatic',
    engine_displacement_cc: 2198,
    power_bhp: 182.38,
    torque_nm: 450.0,
    mileage_kmpl: 16.57,
    safety_rating_ncap: 5.0,
    is_active: true,
    standard_features: [
      '6 Airbags', 'Level 2 ADAS', '360-Degree Surround Camera', 'Electronic Stability Program (ESP)',
      'Hill Hold & Descent Control', 'Blind Spot View Monitor', 'ISOFIX Child Seat Mounts', 'Tyre Pressure Monitoring System (TPMS)',
      '10.25-inch HD Touchscreen', 'Wireless Android Auto & Apple CarPlay', 'JBL 9-Speaker Audio System',
      'Connected Car Tech (eSIM Telematics)', '10.25-inch Digital Cockpit', 'Panoramic Sunroof', 'Ventilated Front Seats',
      'Dual-Zone Automatic Climate Control', 'Wireless Smartphone Charger', '6-Way Powered Driver Seat with Memory',
      'All-Wheel Drive (AWD / 4x4)', 'Electronic Parking Brake with Auto Hold'
    ],
  },
  {
    variant_id: 8,
    variant_name: 'E 1.5 MPI Petrol 6MT',
    model_id: 7,
    model_name: 'Creta',
    manufacturer_name: 'Hyundai Motor India',
    country_origin: 'South Korea',
    body_type: 'SUV',
    seating_capacity: 5,
    ex_showroom_price: 1100000,
    fuel_type: 'Petrol',
    transmission: 'Manual',
    engine_displacement_cc: 1497,
    power_bhp: 113.42,
    torque_nm: 144.0,
    mileage_kmpl: 17.4,
    safety_rating_ncap: 3.0,
    is_active: true,
    standard_features: ['6 Airbags', 'Electronic Stability Program (ESP)', 'Hill Hold & Descent Control', 'ISOFIX Child Seat Mounts'],
  },
  {
    variant_id: 9,
    variant_name: 'SX (O) 1.5 Turbo Petrol 7DCT',
    model_id: 7,
    model_name: 'Creta',
    manufacturer_name: 'Hyundai Motor India',
    country_origin: 'South Korea',
    body_type: 'SUV',
    seating_capacity: 5,
    ex_showroom_price: 2000000,
    fuel_type: 'Petrol',
    transmission: 'DCT',
    engine_displacement_cc: 1482,
    power_bhp: 157.81,
    torque_nm: 253.0,
    mileage_kmpl: 18.4,
    safety_rating_ncap: 5.0,
    is_active: true,
    standard_features: [
      '6 Airbags', 'Level 2 ADAS', '360-Degree Surround Camera', 'Electronic Stability Program (ESP)',
      'Blind Spot View Monitor', 'Tyre Pressure Monitoring System (TPMS)', '10.25-inch HD Touchscreen',
      'Wireless Android Auto & Apple CarPlay', 'JBL 9-Speaker Audio System', 'Connected Car Tech (eSIM Telematics)',
      '10.25-inch Digital Cockpit', 'Panoramic Sunroof', 'Ventilated Front Seats', 'Dual-Zone Automatic Climate Control',
      'Wireless Smartphone Charger', 'Air Purifier with AQI Display', 'Paddle Shifters', 'Electronic Parking Brake with Auto Hold'
    ],
  },
  {
    variant_id: 10,
    variant_name: 'SX (O) 1.5 CRDi Diesel 6AT',
    model_id: 7,
    model_name: 'Creta',
    manufacturer_name: 'Hyundai Motor India',
    country_origin: 'South Korea',
    body_type: 'SUV',
    seating_capacity: 5,
    ex_showroom_price: 2015000,
    fuel_type: 'Diesel',
    transmission: 'Automatic',
    engine_displacement_cc: 1493,
    power_bhp: 114.41,
    torque_nm: 250.0,
    mileage_kmpl: 19.1,
    safety_rating_ncap: 5.0,
    is_active: true,
    standard_features: [
      '6 Airbags', 'Level 2 ADAS', '360-Degree Surround Camera', 'Panoramic Sunroof', 'Ventilated Front Seats',
      'Electronic Stability Program (ESP)', 'Paddle Shifters'
    ],
  },
  {
    variant_id: 11,
    variant_name: '4x2 2.7 Petrol 5MT',
    model_id: 10,
    model_name: 'Fortuner',
    manufacturer_name: 'Toyota Kirloskar Motor',
    country_origin: 'Japan',
    body_type: 'SUV',
    seating_capacity: 7,
    ex_showroom_price: 3343000,
    fuel_type: 'Petrol',
    transmission: 'Manual',
    engine_displacement_cc: 2694,
    power_bhp: 163.6,
    torque_nm: 245.0,
    mileage_kmpl: 10.01,
    safety_rating_ncap: 5.0,
    is_active: true,
    standard_features: ['6 Airbags', 'Electronic Stability Program (ESP)', 'Hill Hold & Descent Control', 'ISOFIX Child Seat Mounts'],
  },
  {
    variant_id: 12,
    variant_name: '4x4 2.8 Diesel 6AT',
    model_id: 10,
    model_name: 'Fortuner',
    manufacturer_name: 'Toyota Kirloskar Motor',
    country_origin: 'Japan',
    body_type: 'SUV',
    seating_capacity: 7,
    ex_showroom_price: 4232000,
    fuel_type: 'Diesel',
    transmission: 'Automatic',
    engine_displacement_cc: 2755,
    power_bhp: 201.2,
    torque_nm: 500.0,
    mileage_kmpl: 14.4,
    safety_rating_ncap: 5.0,
    is_active: true,
    standard_features: [
      '6 Airbags', 'Electronic Stability Program (ESP)', 'Hill Hold & Descent Control', 'ISOFIX Child Seat Mounts',
      'Tyre Pressure Monitoring System (TPMS)', '10.25-inch HD Touchscreen', 'Wireless Android Auto & Apple CarPlay',
      'JBL 9-Speaker Audio System', 'Dual-Zone Automatic Climate Control', 'Ventilated Front Seats',
      '6-Way Powered Driver Seat with Memory', 'All-Wheel Drive (AWD / 4x4)', 'Paddle Shifters'
    ],
  },
  {
    variant_id: 13,
    variant_name: 'GR-Sport 4x4 2.8 Diesel 6AT',
    model_id: 10,
    model_name: 'Fortuner',
    manufacturer_name: 'Toyota Kirloskar Motor',
    country_origin: 'Japan',
    body_type: 'SUV',
    seating_capacity: 7,
    ex_showroom_price: 5144000,
    fuel_type: 'Diesel',
    transmission: 'Automatic',
    engine_displacement_cc: 2755,
    power_bhp: 201.2,
    torque_nm: 500.0,
    mileage_kmpl: 14.4,
    safety_rating_ncap: 5.0,
    is_active: true,
    standard_features: [
      '6 Airbags', 'Electronic Stability Program (ESP)', 'Hill Hold & Descent Control', 'ISOFIX Child Seat Mounts',
      'Tyre Pressure Monitoring System (TPMS)', '360-Degree Surround Camera', '10.25-inch HD Touchscreen',
      'Wireless Android Auto & Apple CarPlay', 'JBL 9-Speaker Audio System', 'Dual-Zone Automatic Climate Control',
      'Ventilated Front Seats', '6-Way Powered Driver Seat with Memory', 'All-Wheel Drive (AWD / 4x4)',
      'Powered Tailgate with Gesture Control', 'Paddle Shifters'
    ],
  },
  {
    variant_id: 14,
    variant_name: 'SX (O) 1.5 Turbo DCT',
    model_id: 8,
    model_name: 'Verna',
    manufacturer_name: 'Hyundai Motor India',
    country_origin: 'South Korea',
    body_type: 'Sedan',
    seating_capacity: 5,
    ex_showroom_price: 1742000,
    fuel_type: 'Petrol',
    transmission: 'DCT',
    engine_displacement_cc: 1482,
    power_bhp: 157.81,
    torque_nm: 253.0,
    mileage_kmpl: 20.6,
    safety_rating_ncap: 5.0,
    is_active: true,
    standard_features: [
      '6 Airbags', 'Level 2 ADAS', 'Electronic Stability Program (ESP)', 'Hill Hold & Descent Control',
      '10.25-inch HD Touchscreen', 'Wireless Android Auto & Apple CarPlay', '10.25-inch Digital Cockpit',
      'Panoramic Sunroof', 'Ventilated Front Seats', 'Air Purifier with AQI Display', 'Paddle Shifters',
      'Electronic Parking Brake with Auto Hold'
    ],
  },
  {
    variant_id: 15,
    variant_name: 'ZX (O) Hybrid 2.0 e-CVT',
    model_id: 11,
    model_name: 'Innova Hycross',
    manufacturer_name: 'Toyota Kirloskar Motor',
    country_origin: 'Japan',
    body_type: 'MUV',
    seating_capacity: 7,
    ex_showroom_price: 3098000,
    fuel_type: 'Hybrid',
    transmission: 'CVT',
    engine_displacement_cc: 1987,
    power_bhp: 183.72,
    torque_nm: 206.0,
    mileage_kmpl: 23.24,
    safety_rating_ncap: 5.0,
    is_active: true,
    standard_features: [
      '6 Airbags', 'Level 2 ADAS', '360-Degree Surround Camera', 'Electronic Stability Program (ESP)',
      'Panoramic Sunroof', 'Ventilated Front Seats', 'Dual-Zone Automatic Climate Control',
      'Powered Tailgate with Gesture Control', 'JBL 9-Speaker Audio System'
    ],
  },
  {
    variant_id: 16,
    variant_name: 'XZ Plus (S) 1.2 Petrol 5MT',
    model_id: 3,
    model_name: 'Altroz',
    manufacturer_name: 'Tata Motors',
    country_origin: 'India',
    body_type: 'Hatchback',
    seating_capacity: 5,
    ex_showroom_price: 910000,
    fuel_type: 'Petrol',
    transmission: 'Manual',
    engine_displacement_cc: 1199,
    power_bhp: 86.8,
    torque_nm: 115.0,
    mileage_kmpl: 19.33,
    safety_rating_ncap: 5.0,
    is_active: true,
    standard_features: ['6 Airbags', 'Electronic Stability Program (ESP)', '10.25-inch HD Touchscreen', 'ISOFIX Child Seat Mounts'],
  },
  {
    variant_id: 17,
    variant_name: 'LX 4-Str Hard Top 2.2 Diesel 6AT 4WD',
    model_id: 5,
    model_name: 'Thar',
    manufacturer_name: 'Mahindra & Mahindra',
    country_origin: 'India',
    body_type: 'SUV',
    seating_capacity: 4,
    ex_showroom_price: 1760000,
    fuel_type: 'Diesel',
    transmission: 'Automatic',
    engine_displacement_cc: 2184,
    power_bhp: 130.0,
    torque_nm: 300.0,
    mileage_kmpl: 15.2,
    safety_rating_ncap: 4.0,
    is_active: true,
    standard_features: ['Electronic Stability Program (ESP)', 'All-Wheel Drive (AWD / 4x4)', 'Hill Hold & Descent Control', 'ISOFIX Child Seat Mounts'],
  },
];

export const SEED_UPCOMING_LAUNCHES: UpcomingLaunch[] = [
  {
    model_id: 2,
    model_name: 'Curvv EV',
    manufacturer_name: 'Tata Motors',
    country_origin: 'India',
    body_type: 'Coupe',
    seating_capacity: 5,
    expected_launch_date: '2026-12-10',
    days_until_launch: 45,
    launch_status: 'upcoming',
    announced_variants_count: 3,
    estimated_starting_price: 1800000,
    estimated_top_price: 2400000,
    highlight_features: ['55 kWh Battery Pack (585 km range)', 'Coupe-SUV Silhouette', 'Vehicle-to-Load (V2L)', 'Level 2 ADAS'],
    battery_or_engine: '55 kWh Liquid Cooled Li-ion',
  },
  {
    model_id: 6,
    model_name: 'BE 6e',
    manufacturer_name: 'Mahindra & Mahindra',
    country_origin: 'India',
    body_type: 'SUV',
    seating_capacity: 5,
    expected_launch_date: '2027-01-25',
    days_until_launch: 91,
    launch_status: 'upcoming',
    announced_variants_count: 2,
    estimated_starting_price: 1890000,
    estimated_top_price: 2690000,
    highlight_features: ['INGLO Dedicated EV Architecture', 'Dual 12.3-inch Cinematic Displays', 'Augmented Reality HUD', 'Semi-active suspension'],
    battery_or_engine: '59 kWh / 79 kWh Blade Cell Battery',
  },
  {
    model_id: 12,
    model_name: 'Urban Cruiser EV',
    manufacturer_name: 'Toyota Kirloskar Motor',
    country_origin: 'Japan',
    body_type: 'SUV',
    seating_capacity: 5,
    expected_launch_date: '2027-02-28',
    days_until_launch: 125,
    launch_status: 'upcoming',
    announced_variants_count: 2,
    estimated_starting_price: 2200000,
    estimated_top_price: 2800000,
    highlight_features: ['AllGrip AWD Dual Motor Option', 'Toyota Safety Sense 3.0', 'Solar Roof Auxiliary Charging', '500+ km Range'],
    battery_or_engine: '60 kWh High Density Pack',
  },
  {
    model_id: 9,
    model_name: 'Ioniq 7',
    manufacturer_name: 'Hyundai Motor India',
    country_origin: 'South Korea',
    body_type: 'SUV',
    seating_capacity: 7,
    expected_launch_date: '2027-04-15',
    days_until_launch: 171,
    launch_status: 'upcoming',
    announced_variants_count: 2,
    estimated_starting_price: 6500000,
    estimated_top_price: 7800000,
    highlight_features: ['800V Ultra-Fast Charging (10-80% in 18 min)', 'Lounge-style Swiveling Chairs', 'E-GMP Flagship Platform', 'Highway Driving Pilot 2'],
    battery_or_engine: '99.8 kWh 800V Architecture',
  },
];
