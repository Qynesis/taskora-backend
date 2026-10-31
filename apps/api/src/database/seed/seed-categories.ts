import { DataSource } from 'typeorm';
import { Category } from '../entities/category.entity';
export const seedCategories = async (dataSource: DataSource) => {
  const repo = dataSource.getRepository(Category);

  const categories = [
    {
      name: 'Electricians',
      mcc: '1731',
      marketingServiceList: `New wiring systems 
Switchboards 
Lighting systems 
Power outlets 
Electrical repairs 
Regular safety inspections and compliance checks
And many more...`
    },
    {
      name: 'Security Camera & Access Systems',
      mcc: '7382',
      marketingServiceList: `Installing CCTV security camera systems 
Installing access control systems 
Installing intercom and video intercom systems
Setting up alarm systems, sensors
Mounting and positioning cameras
And many more…`
    },
    {
      name: 'Data & Communications',
      mcc: '1731',
      marketingServiceList: `Data cabling installation 
Network cabling 
Cable termination and testing 
Patch panel installation and organization 
Fibre optic cabling and termination 
Cable tray, conduit and structured cabling solutions
And many more...`
    },
    {
      name: 'Solar Panel Installation',
      mcc: '1731',
      marketingServiceList: `Solar Panel Installation 
System Design & Assessment
Solar Panel Maintenance
Repairs & Fault Finding
Battery & Energy Storage Solutions
Upgrades & System Improvements
Compliance & Certification
And many more…`
    },
    {
      name: 'Plumbing',
      mcc: '1711',
      marketingServiceList: `Tap, sink, shower and toilet installation
Kitchen and bathroom plumbing
Leak detection and repairs
Burst pipe repairs
Blocked toilets and sinks
Hot water system installation
And many more…`
    },
    {
      name: 'Gas Fitting',
      mcc: '1711',
      marketingServiceList: `Gas appliance installation 
Gas leak detection and repair 
Gas line installation and upgrades 
Gas hot water systems
And many more…`
    },
    {
      name: 'Roofing',
      mcc: '1761',
      marketingServiceList: `Gutter and downpipe installation 
Roof leak repairs 
Rainwater tank installation 
Outdoor taps and irrigation connections
And many more…`
    },
    {
      name: 'Building & Renovations',
      mcc: '1520',
      marketingServiceList: `Complete home renovations and extensions
Complete kitchen, bathroom, and laundry renovations
Garage conversions & granny flat builds
Full project management from design to completion
House additions, alterations & structural changes 
Internal and external home upgrades
And many more...`
    },
    {
      name: 'Asbestos Removal',
      mcc: '1799',
      marketingServiceList: `Asbestos Inspection and hazard identification
Safe removal of bonded asbestos
Approved asbestos waste handling
Decontamination & Site Restoration
Residential & Commercial Services
And many more…`
    },
    {
      name: 'Air Conditioning & Refrigeration',
      mcc: '7623',
      marketingServiceList: `Air Conditioning Installation for Commercial and residential
Air Conditioning Maintenance & Repairs
Refrigeration installation
Gas heating system installation & servicing
Refrigerant Handling & Safety
Commercial HVAC Services
And many more…`
    },
    {
      name: 'Painting',
      mcc: '1740',
      marketingServiceList: `Interior Painting
Exterior Painting
Surface Preparation
Specialist Coatings
Colour & Design Services
Repairs & Maintenance
And many more…`
    },
    {
      name: 'Handyman',
      mcc: '1520',
      marketingServiceList: `General Repairs & Maintenance
Carpentry & Woodwork
Painting & Surface Work
Plumbing (Minor Works)
Electrical (Minor Works – as permitted)
Assembly & Installations
Outdoor & Garden Work
Strata, Real Estate & Commercial Services
And many more…`
    },
    {
      name: 'Pool Repairs and Cleaning',
      mcc: '7389',
      marketingServiceList: `Pool Repairs 
Equipment Installation & Repairs
Pool Servicing & Maintenance
Pool Upgrades & Renovations
Pool Plumbing & Circulation
Cleaning Equipment Services
Commercial Pool Services
And many more...`
    },
    {
      name: 'Waterproofing',
      mcc: '1799',
      marketingServiceList: `Internal & External Waterproofing
Subfloor & Structural Waterproofing
Leak Detection & Repairs
Protective Coatings & Sealants
Tiling Related Waterproofing
Commercial Waterproofing
Inspections, Certification & Compliance
And many more…`
    },
    {
      name: 'Wall and Flooring',
      mcc: '1750',
      marketingServiceList: `Wall Installation & Construction
Wall Finishes
Wall Patch repairs (holes, cracks, dents)
Floor Installation (Timber/Vinyl/Tile/Carpet etc.)
Floor Repairs & Restoration
Floor Upgrades (Skirting board/Underlay installation etc.)
Commercial & Residential
And many more...`
    },
    {
      name: 'Glazier',
      mcc: '1799',
      marketingServiceList: `Glass Installation for Window, Door, Shopfront etc.
Cracked or Broken Glass Repairs & Replacement
Frosted & tinted glass
Safety & Security Glass Like Laminated, Fire-rated
Shower Screens
Doors & Windows installation, framing, proofing
Glass Maintenance & Upkeep
And many more...`
    },
    {
      name: 'TV Mount',
      mcc: '7629',
      marketingServiceList: `TV Mounting & Installation
Cable Management
Home Theatre & Audio Setup
Smart TV Setup
Bracket Supply & Replacement
Commercial TV Mounting
And many more…`
    },
    {
      name: 'Fencing',
      mcc: '1799',
      marketingServiceList: `Fence Installation
Fence Repairs & Maintenance
Custom Fence Solutions
Gate Installation
Pool Fencing
Property Boundary Services
And many more…`
    },
    {
      name: 'Carpentry',
      mcc: '1750',
      marketingServiceList: `Residential and commercial carpentry
Decks, Pergolas & Outdoor Structures
Doors, Windows & Hardware installation
Cabinetry & Joinery
Interior Carpentry & Fit Outs
Repairs & Maintenance
Outdoor Timber Upgrades
And many more…`
    },
    {
      name: 'Bricklaying',
      mcc: '1771',
      marketingServiceList: `Bricklaying & Blocklaying
Brick Repairs & Restoration
Retaining Walls & Garden Structures
Letterboxes & Small Structures
Footpaths, Steps & Paving
Commercial Bricklaying
Rendering & Finishing
And many more…`
    },
    {
      name: 'Domestic Cleaning',
      mcc: '7349',
      marketingServiceList: `Residential Cleaning
Deep Cleaning & Sanitisation
Move In / Move Out Cleaning
Outdoor & External Cleaning
Strata & Common Area Cleaning
And many more…`
    },
    {
      name: 'Commercial / Specialized Cleaning',
      mcc: '7349',
      marketingServiceList: `Corporate & Office Cleaning
Event venue cleaning (pre/post event)
Rental/real estate presentation cleaning
Medical & Clinical Cleaning
Childcare Cleaning
Industrial & Warehouse Cleaning
Hospitality & Retail Cleaning
Strata & Building Cleaning
Specialised Deep Cleaning
Window & Glass Cleaning
High Pressure & Outdoor Cleaning
Waste Management Support
And many more…`
    },
    {
      name: 'Car Wash',
      mcc: '7542',
      marketingServiceList: `Exterior Car Cleaning
Full Detailing Services
Mobile Car Wash Services
Fleet & Commercial Services
4WD & Specialty Cleaning
Paint Protection & Restoration
And many more…`
    },
    {
      name: 'Gardening',
      mcc: '0780',
      marketingServiceList: `Garden Maintenance
Lawn Care Services
Garden Clean Ups
Planting & Garden Design
Hedge & Tree Services
Landscaping (Light to Moderate)
Outdoor Cleaning
Commercial & Strata Gardening
And many more…`
    },
    {
      name: 'Lawn Mowing',
      mcc: '0780',
      marketingServiceList: `Lawn Mowing Services
Lawn Care & Treatment
Garden & Yard Tidy Ups
Property Clean Up Services
Edging & Border Work
Mulching & Plant Care
Commercial & Strata Services
And many more…`
    },
    {
      name: 'Pest Control',
      mcc: '7342',
      marketingServiceList: `General Pest Control
Rodent Control
Termite Services (Timber Pests)
Specialized Pest Treatments
Commercial Pest Control
Inspection & Reporting
Eco Friendly & Low Toxic Options
Outdoor & Property Perimeter
And many more…`
    },
    {
      name: 'Security Guards',
      mcc: '7382',
      marketingServiceList: `On Site Security Guard Services
Licensed Crowd Control & Event Security
Retail & Loss Prevention
Corporate & Commercial Security
Construction Site Security
Alarm Response & Mobile Patrols
CCTV & Monitoring Support
Emergency & Incident Response
Specialised Security Services
And many more…`
    },
    {
      name: 'Removalists (Transport)',
      mcc: '4215',
      marketingServiceList: `Local & Residential Moves
Commercial & Office Moves
Packing & Unpacking Services
Furniture Handling
Transport Services
Specialty Item Moves & Storage Solutions
Cleaning & End of Lease Services
Pre Move & Post Move Services
And many more…`
    },
    {
      name: 'Locksmith',
      mcc: '7251',
      marketingServiceList: `Emergency Locksmith Services
Residential Locksmith Services
Commercial Locksmith Services
Automotive Locksmith Services
Security & Access Solutions
Lock Repairs & Maintenance
Door Hardware & Security Upgrades
And many more…`
    },
    {
      name: 'Web & App Development',
      mcc: '7372',
      marketingServiceList: `Website Development
E Commerce Development
Mobile App Development
Custom Software & Web Applications
UI/UX Design
SEO & Digital Optimisation
Security, Hosting & Maintenance
System Integration & Automation
Content Management
And many more…`
    },
    {
      name: 'Graphics Design',
      mcc: '7372',
      marketingServiceList: `Branding & Identity Design
Print Design
Digital & Web Graphics
Marketing & Advertising Design
Illustration & Custom Artwork
UI/UX Design
E Commerce & Product Design
Photo Editing & Retouching
Corporate & Business Services
And many more…`
    },
    {
      name: 'IT Consulting & Strategy',
      mcc: '7372',
      marketingServiceList: `Technology & Digital Strategy
Business & IT Alignment
IT Infrastructure Consulting
Cybersecurity Consulting
Software & Systems Consulting
Cloud Consulting
Digital Workplace Solutions
Project Management & Delivery
Data & Analytics Consulting
IT Support Strategy
And many more…`
    },
    {
      name: 'Technical Support & Help Desk',
      mcc: '7372',
      marketingServiceList: `Help Desk Support (Level 1, 2 & 3)
IT Support & Troubleshooting
On Site Technical Support
Cloud Support
Network & Infrastructure Support
Cybersecurity Support
Device Setup & Configuration
IT Training & End User Support
And many more…`
    },
    {
      name: 'Communication & Collaboration Tools',
      mcc: '7372',
      marketingServiceList: `Unified Communication Solutions
Collaboration Platform Setup
Video Conferencing & Meeting Rooms
File Sharing & Document Collaboration
Email & Messaging Services
Project Management Tools
Productivity & Workflow Automation
Security & Access Controls
Training & Adoption Services
And many more…`
    },
    {
      name: 'ICT Network Setup',
      mcc: '7372',
      marketingServiceList: `Home & Office Network Setup
Wi Fi Setup & Optimisation
Wired Network Installation
Small Business Network Solutions
Network Security Services
Cloud & Remote Access
Internet Troubleshooting
Smart Home Network Integration
Network Monitoring & Maintenance
Enterprise & Advanced Networking
And many more…`
    },
    {
      name: 'Tax Agent',
      mcc: '7276',
      marketingServiceList: `Individual Tax Services
Business Tax Services
Bookkeeping & Accounting Support
Tax Planning & Advisory
Business Setup & Registration
ATO Support & Representation
And many more…`
    },
    {
      name: 'Accountants',
      mcc: '8931',
      marketingServiceList: `Tax & Compliance
Business Accounting
Bookkeeping Services
Business Setup & Structuring
Tax Planning & Advisory
Payroll & Superannuation
Business Growth & Advisory
Cloud Accounting & Automation
And many more…`
    },
    {
      name: 'Professional Entertainer',
      mcc: '7929',
      marketingServiceList: `Live Performance Services
Event Entertainment
Specialty Acts
Custom Entertainment Packages
Corporate & Professional Services
Children’s Entertainment
Digital & Virtual Entertainment
And many more…`
    },
    {
      name: 'Beauticians',
      mcc: '7297',
      marketingServiceList: `Skin & Facial Treatments
Brows & Lashes
Makeup Services
Mehedi
Henna
Face Painting
Manicure & Pedicure Services
Body Treatments
Massage Services
Advanced Beauty Treatments (where certified)
Bridal & Event Packages
Men’s Grooming Services
Retail & Consultation
And many more…`
    },
    {
      name: 'Hairdresser',
      mcc: '7230',
      marketingServiceList: `Hair Cutting & Styling
Colouring Services
Lightening & Creative Colour
Hair Treatments
Styling for Events
Hair Extensions (where certified)
Men’s Grooming Services
Children & Teen Services
And many more…`
    },
    {
      name: 'Barbers',
      mcc: '7230',
      marketingServiceList: `Haircuts & Grooming
Beard & Facial Hair Services
Shaving Services
Styling & Finishing
Children & Teens
Men’s Grooming Treatments
And many more…`
    },
    {
      name: 'Florist',
      mcc: '5992',
      marketingServiceList: `Fresh Flower Arrangements
Event & Special Occasion Flowers
Wedding Floral Design
Corporate Floral Services
Funeral & Sympathy Flowers
Plants & Gifts
Flower Subscriptions
Specialty Floral Installations
Delivery Services
And many more…`
    },
    {
      name: 'Photographer',
      mcc: '7221',
      marketingServiceList: `Portrait Photography
Event Photography
Wedding & Engagement Photography
Commercial & Business Photography
Real Estate & Property Photography
Creative & Lifestyle Photography
Sports & Action Photography
Drone & Aerial Photography (where certified)
Editing & Post Production
And many more…`
    },
    {
      name: 'Videographer',
      mcc: '7221',
      marketingServiceList: `Event Videography
Business & Corporate Video
Marketing & Promotional Videos
Creative & Cinematic Productions
Real Estate Videography
Drone & Aerial Videography (licensed where required)
Product & E Commerce Video
Editing & Post Production
Social Media Content Creation
And many more…`
    },
    {
      name: 'Event Co-Ordinator',
      mcc: '7389',
      marketingServiceList: `Event Planning & Coordination
Corporate Event Services
Social & Private Events
Birthday & Wedding Coordination
Event Design & Styling
Logistics & Operations
Entertainment & Vendor Management
Event Marketing Support
Virtual & Hybrid Event Services
And many more…`
    },
    {
      name: 'Tailors',
      mcc: '5697',
      marketingServiceList: `Clothing Alterations
Custom Tailoring
Wedding & Formal Wear Alterations
Men’s Tailoring Services
Women’s Tailoring Services
Garment Repairs
Restyling & Upcycling
Fittings & Consultations
And many more…`
    },
    {
      name: 'Tutors',
      mcc: '8299',
      marketingServiceList: `NAPLAN Teacher
Math Teacher
Linguistic Teacher
Arabic Teacher
Mandarin Teacher
English Teacher
Academic Tutoring
Subject Specific Tutoring
Exam & Test Preparation
Specialized Learning Support
Online Tutoring Services
In Person Tutoring
Adult & Professional Learning
Creative & Enrichment Programs
Study Planning & Academic Coaching
And many more…`
    },
    {
      name: 'Driving Instructors',
      mcc: '7911',
      marketingServiceList: `Learner Driver Training
Test Preparation Services
Advanced & Defensive Driving
Specialty Driver Training
Road Rules & Safety Education
Specialized Parking Lessons
Car Control & Vehicle Knowledge
Corporate & Fleet Driver Training
Convenience & Support Services
And many more…`
    },
    {
      name: 'Event Driver (Wedding & Formal Event)',
      mcc: '4111',
      marketingServiceList: `Professional event driving services
Wedding & Formal Event Driving
Special Occasions & Social Events
And many more…`
    },
    {
      name: 'Marketing',
      mcc: '7311',
      marketingServiceList: `Marketing Strategy & Planning
Digital Marketing
Content Marketing
Brand Development & Design
Advertising & Campaigns
Social Media Management
Public Relations & Communications
Website & Digital Presence
Video & Creative Production
Market Research & Analysis
Event & Campaign Support
And many more…`
    }
  ];

  // Use upsert to avoid duplicates
  await repo.upsert(categories, ['name']);

  console.log('✅ Categories seeded successfully');
};