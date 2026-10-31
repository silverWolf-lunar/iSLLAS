export interface MobileNewsArticle {
  id: string;
  title: string;
  category: 'CROPS' | 'FINANCE' | 'LIVESTOCK' | 'TENURE';
  source: string;
  date: string;
  readTime: string;
  imageKey: keyof typeof NEWS_IMAGES;
  summary: string;
  bulletPoints: string[];
  fullGazetteText: string;
}

export const NEWS_IMAGES = {
  wheat: require('./assets/news/herald-wheat-farming.jpg'),
  jointVentures: require('./assets/news/herald-joint-ventures.jpg'),
  tobacco: require('./assets/news/herald-tobacco.jpg'),
  rangeland: require('./assets/news/herald-rangeland.jpg'),
  nutrition: require('./assets/news/herald-nutrition-security.jpg'),
  farming: require('./assets/news/herald-all-things-farming.jpg'),
  zmx: require('./assets/news/herald-zmx-finance.jpg'),
};

export const MOBILE_NEWS_ARTICLES: MobileNewsArticle[] = [
  {
    id: 'winter-wheat-herald',
    title: 'National Winter Wheat Production: All Systems Go Across Irrigated Commercial Farmlands',
    category: 'CROPS',
    source: 'The Herald Agriculture Desk',
    date: 'Today • Special Bulletin',
    readTime: '4 min read',
    imageKey: 'wheat',
    summary: 'The Government and agricultural stakeholders have activated comprehensive support measures for winter wheat farming across all provincial farming blocks, ensuring full availability of irrigation water, seed, and fertiliser.',
    bulletPoints: [
      'Targeted 120,000 hectares under active centre-pivot and canal irrigation.',
      'GMB grain reception depots equipped with moisture meters and drying facilities.',
      'Fuel and electricity ring-fenced for continuous wheat irrigation cycles.',
    ],
    fullGazetteText: 'As reported by The Herald Agriculture Desk, Zimbabwe is poised to sustain national wheat self-sufficiency as winter wheat preparations enter peak execution. The Ministry of Lands, Agriculture, Fisheries, Water and Rural Development announced that seed houses, commercial banks, and the Grain Marketing Board have finalised distribution of inputs to commercial A2 and smallholder irrigation schemes.',
  },
  {
    id: 'joint-ventures-herald',
    title: '2,701 Agricultural Joint Ventures Approved to Unlock Idle Farmland & Boost Production',
    category: 'FINANCE',
    source: 'The Herald Online',
    date: 'Yesterday • Land Settlement Directorate',
    readTime: '3 min read',
    imageKey: 'jointVentures',
    summary: 'The Ministry has formally approved 2,701 agricultural joint venture partnerships, pairing A1 and A2 land beneficiaries with commercial agribusiness investors to scale up grain and horticulture output.',
    bulletPoints: [
      'Over 220,000 hectares brought into commercial production through vetted partnerships.',
      'Protects leaseholder tenure while injecting private capital and combine harvesters.',
      'Tripartite agreements legally witnessed and monitored by provincial land committees.',
    ],
    fullGazetteText: 'According to The Herald, more than 2,701 agricultural joint venture agreements have been ratified by the Ministry of Lands. The policy provides a secure legal vehicle for farmers lacking capital to partner with private agribusiness operators without forfeiting their land rights.',
  },
  {
    id: 'tobacco-farmers-herald',
    title: 'Tobacco Farmers Count Losses From Barn Fires As Curing Season Gathers Momentum',
    category: 'CROPS',
    source: 'The Herald Agriculture Desk',
    date: '2 days ago • TIMB Advisory',
    readTime: '3 min read',
    imageKey: 'tobacco',
    summary: 'Tobacco farmers across major growing belts are taking precautionary measures following recorded fire outbreaks in curing barns, with TIMB intensifying farmer training on modern rocket barns and fuel efficiency.',
    bulletPoints: [
      'TIMB deploys extension officers to train farmers on modern rocket barns.',
      'Insurance coverage urged to cushion growers against curing facility losses.',
      'Promotes fuel-efficient coal and renewable briquettes to reduce timber deforestation.',
    ],
    fullGazetteText: 'As reported by The Herald, tobacco growers across Mashonaland West and Central provinces have suffered curing losses following accidental barn fires. TIMB in partnership with the Department of Agricultural Engineering is rolling out nationwide safety audits of curing infrastructure.',
  },
  {
    id: 'rangeland-rehab-herald',
    title: 'Rangeland Management & Pasture Rehabilitation Expanded to Protect National Cattle Herds',
    category: 'LIVESTOCK',
    source: 'The Herald Agriculture Desk',
    date: '3 days ago • Livestock Notice',
    readTime: '3 min read',
    imageKey: 'rangeland',
    summary: 'To bolster the national beef and dairy herd, the Department of Livestock Development has rolled out restorative grazing models, paddock rotational fencing, and drought-tolerant fodder cultivation across southern and western provinces.',
    bulletPoints: [
      'Community fodder banks and drought-tolerant legume pastures established across Regions IV & V.',
      'Solar borehole drilling at livestock watering points to minimise trekking distances.',
      'Rotational grazing plans enforced to prevent soil erosion and pasture degradation.',
    ],
    fullGazetteText: 'The Herald reports that the Ministry has scaled up rangeland reclamation and grazing management programmes. Livestock farming communities across Matabeleland, Masvingo, and Midlands are being capacitated with solar-powered boreholes, paddock rotational fences, and drought-hardy fodder crops.',
  },
  {
    id: 'nutrition-security-herald',
    title: 'Nutrition Security Bolstered as Traditional Grains Harvesting Peaks Across Provinces',
    category: 'CROPS',
    source: 'The Herald Agriculture Desk',
    date: '4 days ago • Food Security Notice',
    readTime: '3 min read',
    imageKey: 'nutrition',
    summary: 'Sorghum, pearl millet, and finger millet harvesting is currently at its peak across semi-arid ecological zones, with the Grain Marketing Board offering competitive buyback incentives.',
    bulletPoints: [
      'Record traditional grain intake recorded at provincial GMB collection points.',
      'Pfumvudza/Intwasa climate-proofed plots yield bumper harvest in drought-prone districts.',
      'Government expands national food reserve storage facilities in rural communities.',
    ],
    fullGazetteText: 'The Herald highlights the growing success of climate-proofing agriculture in Zimbabwe. Smallholder and commercial farmers who planted traditional grains under the Presidential Pfumvudza/Intwasa scheme are celebrating substantial yields, strengthening national household nutrition security.',
  },
  {
    id: 'all-things-farming-herald',
    title: 'All Things Farming: Sustainable Agribusiness Models Powering Vision 2030 Growth',
    category: 'TENURE',
    source: 'The Sunday Mail Agriculture',
    date: '5 days ago • Policy Feature',
    readTime: '4 min read',
    imageKey: 'farming',
    summary: 'Agricultural transformation is delivering measurable economic growth as the bankable 99-year leasehold framework gives farmers unprecedented access to commercial loans and mechanisation.',
    bulletPoints: [
      'Bankable 99-year leases unlocking private sector credit from leading commercial banks.',
      'Smart agricultural technology and drone cadastre mapping deployed across all provinces.',
      'Young farmers and women in agriculture allocated 30% of newly regularised subdivisions.',
    ],
    fullGazetteText: 'In a feature by The Sunday Mail, agrarian reform in Zimbabwe is highlighted as entering a new phase of bankability and technological sophistication. The Smart Land Administration System (SLLAS) guarantees legal certainty and cadastral accuracy, positioning agriculture as an anchor of national GDP.',
  },
];
