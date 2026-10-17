import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Coins, Calculator, ShieldCheck, Heart, Sparkles, Check, 
  HelpCircle, Printer, ArrowRight, Layers, PawPrint, Info,
  TrendingDown, CheckCircle2, ChevronRight, AlertCircle, ShoppingBag
} from 'lucide-react';
import { petsApi } from '../api/petsApi';
import AdopterHeader from '../components/AdopterHeader';
import '../styles/cost-calculator.css';

// Base Presets by Pet Type
const PET_PRESETS = [
  {
    id: 'dog-small',
    label: 'Small Dog',
    sub: 'Under 10 kg (Beagle, Corgi, Indie)',
    emoji: '🐕',
    species: 'dog',
    size: 'small',
    foodMultiplier: 1.0,
    baseFood: 1400,
    basePreventative: 550,
    baseInitialSetup: 3500,
  },
  {
    id: 'dog-medium',
    label: 'Medium Dog',
    sub: '10–25 kg (Indie, Border Collie)',
    emoji: '🦮',
    species: 'dog',
    size: 'medium',
    foodMultiplier: 1.4,
    baseFood: 2200,
    basePreventative: 650,
    baseInitialSetup: 4500,
  },
  {
    id: 'dog-large',
    label: 'Large Dog',
    sub: '25+ kg (Golden Retriever, Lab)',
    emoji: '🐕‍🦺',
    species: 'dog',
    size: 'large',
    foodMultiplier: 2.0,
    baseFood: 3400,
    basePreventative: 850,
    baseInitialSetup: 5800,
  },
  {
    id: 'cat',
    label: 'Cat',
    sub: 'Domestic Shorthair, Persian',
    emoji: '🐱',
    species: 'cat',
    size: 'small',
    foodMultiplier: 0.8,
    baseFood: 1200,
    basePreventative: 450,
    baseInitialSetup: 3200,
  },
  {
    id: 'small-pet',
    label: 'Small Pet',
    sub: 'Rabbit, Bird, etc.',
    emoji: '🐰',
    species: 'other',
    size: 'small',
    foodMultiplier: 0.5,
    baseFood: 750,
    basePreventative: 250,
    baseInitialSetup: 2200,
  },
];

const PetCostCalculatorPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const petIdQuery = searchParams.get('pet');

  const [availablePets, setAvailablePets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(petIdQuery || '');
  const [selectedPresetId, setSelectedPresetId] = useState('dog-medium');

  // Diet tier: 'standard' | 'premium' | 'fresh'
  const [dietTier, setDietTier] = useState('premium');

  // Grooming frequency: 'diy' | 'bimonthly' | 'monthly'
  const [groomingPlan, setGroomingPlan] = useState('diy');

  // Healthcare routine buffer: ₹0 to ₹3000
  const [emergencyBuffer, setEmergencyBuffer] = useState(1000);

  // Preventative healthcare included?
  const [includePreventative, setIncludePreventative] = useState(true);

  // Monthly supplies (toys, treats, waste bags, litter)
  const [monthlySupplies, setMonthlySupplies] = useState(600);

  // One-time Setup Items Checklist
  const [setupItems, setSetupItems] = useState({
    adoptionFee: true,
    microchip: true,
    starterKit: true, // Bed, bowls, collar, leash
    vaccineCheckup: true,
    carrierOrCrate: true,
  });

  // Load real available pets from database
  useEffect(() => {
    const loadPets = async () => {
      try {
        const res = await petsApi.list({ status: 'available' });
        const list = res.pets || [];
        setAvailablePets(list);

        // If URL has a specific pet, preselect it and adjust preset
        if (petIdQuery) {
          const match = list.find(p => String(p.id) === String(petIdQuery));
          if (match) {
            setSelectedPetId(match.id);
            const sp = (match.species || '').toLowerCase();
            const sz = (match.size || '').toLowerCase();
            if (sp.includes('cat')) setSelectedPresetId('cat');
            else if (sp.includes('rabbit') || sp.includes('bird')) setSelectedPresetId('small-pet');
            else if (sz.includes('large')) setSelectedPresetId('dog-large');
            else if (sz.includes('small')) setSelectedPresetId('dog-small');
            else setSelectedPresetId('dog-medium');
          }
        }
      } catch (e) {
        console.error('Failed to load pets:', e);
      }
    };
    loadPets();
  }, [petIdQuery]);

  // When real pet is selected from dropdown
  const handleRealPetSelect = (petId) => {
    setSelectedPetId(petId);
    if (!petId) return;
    const match = availablePets.find(p => String(p.id) === String(petId));
    if (match) {
      const sp = (match.species || '').toLowerCase();
      const sz = (match.size || '').toLowerCase();
      if (sp.includes('cat')) setSelectedPresetId('cat');
      else if (sp.includes('rabbit') || sp.includes('bird')) setSelectedPresetId('small-pet');
      else if (sz.includes('large')) setSelectedPresetId('dog-large');
      else if (sz.includes('small')) setSelectedPresetId('dog-small');
      else setSelectedPresetId('dog-medium');
    }
  };

  const currentPreset = PET_PRESETS.find(p => p.id === selectedPresetId) || PET_PRESETS[1];
  const activePetDoc = availablePets.find(p => String(p.id) === String(selectedPetId));

  // Toggle setup item
  const toggleSetupItem = (key) => {
    setSetupItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CALCULATIONS
  // ─────────────────────────────────────────────────────────────────────────
  const calculations = useMemo(() => {
    // 1. Food cost based on preset & diet tier
    let foodCost = currentPreset.baseFood;
    if (dietTier === 'standard') foodCost = Math.round(currentPreset.baseFood * 0.75);
    if (dietTier === 'fresh') foodCost = Math.round(currentPreset.baseFood * 1.6);

    // 2. Grooming cost
    let groomingCost = 0;
    if (groomingPlan === 'bimonthly') {
      groomingCost = currentPreset.species === 'cat' ? 450 : 700;
    } else if (groomingPlan === 'monthly') {
      groomingCost = currentPreset.species === 'cat' ? 900 : 1500;
    }

    // 3. Preventative care
    const preventativeCost = includePreventative ? currentPreset.basePreventative : 0;

    // 4. Emergency reserve
    const bufferCost = Number(emergencyBuffer) || 0;

    // 5. Total Monthly
    const monthlyTotal = foodCost + groomingCost + preventativeCost + bufferCost + monthlySupplies;

    // 6. One-time Setup Items
    const setupCosts = {
      adoptionFee: setupItems.adoptionFee ? 1000 : 0, // Typical non-profit adoption processing fee
      microchip: setupItems.microchip ? 800 : 0,
      starterKit: setupItems.starterKit ? (currentPreset.species === 'cat' ? 1800 : 2600) : 0,
      vaccineCheckup: setupItems.vaccineCheckup ? 1200 : 0,
      carrierOrCrate: setupItems.carrierOrCrate ? (currentPreset.species === 'cat' ? 1200 : 2200) : 0,
    };

    const oneTimeTotal = Object.values(setupCosts).reduce((acc, v) => acc + v, 0);

    // 7. First-Year Total
    const firstYearTotal = oneTimeTotal + (monthlyTotal * 12);

    // Percentage Breakdown for visual bar
    const foodShare = Math.round((foodCost / monthlyTotal) * 100);
    const vetShare = Math.round((preventativeCost / monthlyTotal) * 100);
    const groomingShare = Math.round((groomingCost / monthlyTotal) * 100);
    const bufferShare = Math.round((bufferCost / monthlyTotal) * 100);
    const suppliesShare = Math.max(0, 100 - (foodShare + vetShare + groomingShare + bufferShare));

    return {
      foodCost,
      groomingCost,
      preventativeCost,
      bufferCost,
      monthlySupplies,
      monthlyTotal,
      oneTimeTotal,
      firstYearTotal,
      foodShare,
      vetShare,
      groomingShare,
      bufferShare,
      suppliesShare,
    };
  }, [currentPreset, dietTier, groomingPlan, emergencyBuffer, includePreventative, monthlySupplies, setupItems]);

  const formatINR = (val) => `₹${Number(val).toLocaleString('en-IN')}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pcc-page">
      <AdopterHeader backLink="/pets" backText="Back to Pets" />

      <div className="pcc-container">
        {/* Hero Header */}
        <div className="pcc-hero-header">
          <div className="pcc-badge">
            <Coins size={15} /> Transparent Pet Parenthood Planning
          </div>
          <h1 className="pcc-title">
            Pet Adoption Cost &amp; Budget Planner
          </h1>
          <p className="pcc-subtitle">
            Understand the real-world investment before bringing your companion home. Estimate first-year setup, monthly nutrition, healthcare, and emergency veterinary reserves.
          </p>
        </div>

        {/* Real Pet Quick Select Banner if pets exist */}
        {availablePets.length > 0 && (
          <div style={{ background: '#F8F5EF', border: '1px solid #EBE6DE', borderRadius: 14, padding: '0.85rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <PawPrint size={18} color="#174C38" />
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#162620' }}>
                Planning for a specific shelter pet?
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select
                className="ap-select"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', minWidth: 200 }}
                value={selectedPetId}
                onChange={e => handleRealPetSelect(e.target.value)}
              >
                <option value="">-- Or calculate for general pet type --</option>
                {availablePets.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.breed || p.species} • {p.size || 'Medium'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Selected Real Pet Showcase Card */}
        {activePetDoc && (
          <div style={{ background: '#FFFFFF', border: '2px solid #2D6A4F', borderRadius: 16, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', boxShadow: '0 4px 16px rgba(45, 106, 79, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img
                src={activePetDoc.photo_url || activePetDoc.image_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=150&q=80'}
                alt={activePetDoc.name}
                style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#162620', fontWeight: 800 }}>{activePetDoc.name}</h3>
                  <span style={{ background: '#E8F5E9', color: '#166534', fontSize: '0.74rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 8 }}>
                    {activePetDoc.species} • {activePetDoc.size || 'Medium'}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#688075', marginTop: 2 }}>
                  🎂 {activePetDoc.age ? `${activePetDoc.age} yrs` : 'Adult'} • 📍 {activePetDoc.location || activePetDoc.shelter_name || 'Rescue Shelter'}
                </div>
              </div>
            </div>

            <Link to={`/pets/${activePetDoc.id}`} className="ap-btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              🐾 View {activePetDoc.name}'s Profile
            </Link>
          </div>
        )}

        {/* Main Interactive Grid */}
        <div className="pcc-grid">
          {/* LEFT: Controls & Toggles */}
          <div>
            {/* Step 1: Pet Type Selection */}
            <div className="pcc-card">
              <div className="pcc-card-header">
                <div className="pcc-card-icon">
                  <PawPrint size={20} />
                </div>
                <div>
                  <h2 className="pcc-card-title">1. Select Pet Size &amp; Category</h2>
                  <div style={{ fontSize: '0.78rem', color: '#688075' }}>
                    Food and supply expenses scale significantly with pet weight
                  </div>
                </div>
              </div>

              <div className="pcc-pet-selector-grid">
                {PET_PRESETS.map(preset => {
                  const isActive = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      className={`pcc-pet-btn ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedPresetId(preset.id);
                        setSelectedPetId('');
                      }}
                    >
                      <span className="pcc-pet-emoji">{preset.emoji}</span>
                      <span className="pcc-pet-name">{preset.label}</span>
                      <span className="pcc-pet-sub">{preset.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Food & Diet Tier */}
            <div className="pcc-card">
              <div className="pcc-card-header">
                <div className="pcc-card-icon">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h2 className="pcc-card-title">2. Nutrition &amp; Daily Diet Quality</h2>
                  <div style={{ fontSize: '0.78rem', color: '#688075' }}>
                    Quality nutrition reduces chronic vet bills over your pet's life
                  </div>
                </div>
              </div>

              <div className="pcc-control-group">
                <div className="pcc-control-header">
                  <span className="pcc-label">Diet Quality Tier</span>
                  <span className="pcc-val-badge">{formatINR(calculations.foodCost)} / month</span>
                </div>

                <div className="pcc-options-grid">
                  {[
                    { key: 'standard', title: 'Standard Kibble', price: 'Affordable commercial balanced dry food' },
                    { key: 'premium', title: 'Premium Grain-Free', price: 'High-protein, prebiotic & joint care' },
                    { key: 'fresh', title: 'Fresh / Organic Diet', price: 'Vet-formulated fresh cooked meat & veg' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      className={`pcc-option-btn ${dietTier === opt.key ? 'active' : ''}`}
                      onClick={() => setDietTier(opt.key)}
                    >
                      <span className="pcc-option-title">{opt.title}</span>
                      <span className="pcc-option-price">{opt.price}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pcc-control-group" style={{ marginTop: '1.25rem' }}>
                <div className="pcc-control-header">
                  <span className="pcc-label">Monthly Treats, Chews &amp; Hygiene</span>
                  <span className="pcc-val-badge">{formatINR(monthlySupplies)} / month</span>
                </div>
                <div className="pcc-slider-wrap">
                  <input
                    type="range"
                    min="300"
                    max="1800"
                    step="100"
                    value={monthlySupplies}
                    onChange={e => setMonthlySupplies(Number(e.target.value))}
                    className="pcc-range"
                  />
                  <div className="pcc-slider-ticks">
                    <span>₹300 (Essentials)</span>
                    <span>₹1,000 (Toys &amp; Dental chews)</span>
                    <span>₹1,800 (Gourmet)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Healthcare & Routine Care */}
            <div className="pcc-card">
              <div className="pcc-card-header">
                <div className="pcc-card-icon">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h2 className="pcc-card-title">3. Healthcare &amp; Emergency Buffer</h2>
                  <div style={{ fontSize: '0.78rem', color: '#688075' }}>
                    Routine prevention keeps unexpected illnesses away
                  </div>
                </div>
              </div>

              {/* Preventative Checkbox */}
              <div
                className={`pcc-check-item ${includePreventative ? 'checked' : ''}`}
                onClick={() => setIncludePreventative(!includePreventative)}
              >
                <div className="pcc-check-left">
                  <input
                    type="checkbox"
                    checked={includePreventative}
                    onChange={() => {}}
                    className="pcc-checkbox"
                  />
                  <div>
                    <div className="pcc-check-label">Monthly Flea, Tick &amp; Heartworm Prevention</div>
                    <div style={{ fontSize: '0.75rem', color: '#688075' }}>Oral chewable / spot-on prevention against tick fever</div>
                  </div>
                </div>
                <span className="pcc-check-price">+{formatINR(currentPreset.basePreventative)} / mo</span>
              </div>

              {/* Emergency Reserve Buffer Slider */}
              <div className="pcc-control-group" style={{ marginTop: '1.25rem' }}>
                <div className="pcc-control-header">
                  <span className="pcc-label">
                    Monthly Emergency Vet Reserve Fund
                    <span title="Setting aside funds monthly covers accidental trauma, ingestions, or unexpected sickness" style={{ cursor: 'pointer', color: '#7A9187' }}>
                      <HelpCircle size={14} />
                    </span>
                  </span>
                  <span className="pcc-val-badge">{formatINR(emergencyBuffer)} / month</span>
                </div>

                <div className="pcc-slider-wrap">
                  <input
                    type="range"
                    min="0"
                    max="3000"
                    step="250"
                    value={emergencyBuffer}
                    onChange={e => setEmergencyBuffer(Number(e.target.value))}
                    className="pcc-range"
                  />
                  <div className="pcc-slider-ticks">
                    <span>₹0 (None)</span>
                    <span>₹1,000 (Recommended)</span>
                    <span>₹3,000 (Full Safety Net)</span>
                  </div>
                </div>
              </div>

              {/* Grooming */}
              <div className="pcc-control-group" style={{ marginTop: '1.25rem' }}>
                <div className="pcc-control-header">
                  <span className="pcc-label">Grooming Plan</span>
                  <span className="pcc-val-badge">
                    {calculations.groomingCost === 0 ? '₹0 (DIY)' : `${formatINR(calculations.groomingCost)} / mo`}
                  </span>
                </div>

                <div className="pcc-options-grid">
                  {[
                    { key: 'diy', title: 'Home Bathing', price: '₹0 (Brush & shampoo at home)' },
                    { key: 'bimonthly', title: 'Bi-Monthly Salon', price: 'Every 2 months (Nails & bath)' },
                    { key: 'monthly', title: 'Monthly Full Spa', price: 'Full hair cut, bath & ear clean' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      className={`pcc-option-btn ${groomingPlan === opt.key ? 'active' : ''}`}
                      onClick={() => setGroomingPlan(opt.key)}
                    >
                      <span className="pcc-option-title">{opt.title}</span>
                      <span className="pcc-option-price">{opt.price}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 4: One-Time Initial Setup Items */}
            <div className="pcc-card">
              <div className="pcc-card-header">
                <div className="pcc-card-icon">
                  <Layers size={20} />
                </div>
                <div>
                  <h2 className="pcc-card-title">4. Initial Setup &amp; Adoption Expenses (One-Time)</h2>
                  <div style={{ fontSize: '0.78rem', color: '#688075' }}>
                    Gear, adoption administration, and starter necessities
                  </div>
                </div>
              </div>

              {[
                { k: 'adoptionFee', label: 'Shelter Adoption Fee', sub: 'Supports medical recovery & shelter operations', cost: 1000 },
                { k: 'starterKit', label: 'Bedding, Bowls, Leash & Collar', sub: 'Comfortable orthopaedic bed, chew-proof bowls', cost: currentPreset.species === 'cat' ? 1800 : 2600 },
                { k: 'microchip', label: 'Microchip & National Pet Registry', sub: 'Permanent lifetime recovery identification', cost: 800 },
                { k: 'vaccineCheckup', label: 'Initial Wellness Vet Exam', sub: 'Baseline health screen & initial deworming', cost: 1200 },
                { k: 'carrierOrCrate', label: 'Travel Carrier / Training Crate', sub: 'Safe travel crate and home safe-haven space', cost: currentPreset.species === 'cat' ? 1200 : 2200 },
              ].map(item => {
                const isChecked = setupItems[item.k];
                return (
                  <div
                    key={item.k}
                    className={`pcc-check-item ${isChecked ? 'checked' : ''}`}
                    onClick={() => toggleSetupItem(item.k)}
                  >
                    <div className="pcc-check-left">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="pcc-checkbox"
                      />
                      <div>
                        <div className="pcc-check-label">{item.label}</div>
                        <div style={{ fontSize: '0.74rem', color: '#688075' }}>{item.sub}</div>
                      </div>
                    </div>
                    <span className="pcc-check-price">+{formatINR(item.cost)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Live Budget Summary (Sticky) */}
          <div className="pcc-summary-box">
            {/* Hero Gradient Total Card */}
            <div className="pcc-hero-budget-card">
              <div className="pcc-total-label">Estimated Monthly Average</div>
              <div className="pcc-total-num">{formatINR(calculations.monthlyTotal)}</div>
              <div className="pcc-total-sub">
                per month for a {currentPreset.label}
              </div>

              <div className="pcc-hero-stats-row">
                <div className="pcc-hero-stat-block">
                  <span className="pcc-hero-stat-label">Initial One-Time Setup</span>
                  <span className="pcc-hero-stat-val">{formatINR(calculations.oneTimeTotal)}</span>
                </div>
                <div className="pcc-hero-stat-block">
                  <span className="pcc-hero-stat-label">First-Year Estimated Total</span>
                  <span className="pcc-hero-stat-val">{formatINR(calculations.firstYearTotal)}</span>
                </div>
              </div>
            </div>

            {/* Visual Category Breakdown Bar */}
            <div className="pcc-breakdown-card">
              <h3 className="pcc-breakdown-title">Monthly Expense Breakdown</h3>

              <div className="pcc-stacked-bar">
                <div className="pcc-stacked-seg food" style={{ width: `${calculations.foodShare}%` }} title={`Food: ${calculations.foodShare}%`} />
                <div className="pcc-stacked-seg vet" style={{ width: `${calculations.vetShare}%` }} title={`Vet Preventative: ${calculations.vetShare}%`} />
                <div className="pcc-stacked-seg buffer" style={{ width: `${calculations.bufferShare}%` }} title={`Emergency Buffer: ${calculations.bufferShare}%`} />
                <div className="pcc-stacked-seg grooming" style={{ width: `${calculations.groomingShare}%` }} title={`Grooming: ${calculations.groomingShare}%`} />
                <div className="pcc-stacked-seg supplies" style={{ width: `${calculations.suppliesShare}%` }} title={`Treats & Toys: ${calculations.suppliesShare}%`} />
              </div>

              <div className="pcc-legend-list">
                <div className="pcc-legend-item">
                  <span><span className="pcc-legend-dot" style={{ background: '#2D6A4F' }} /> Food &amp; Nutrition</span>
                  <span className="pcc-legend-val">{formatINR(calculations.foodCost)}</span>
                </div>
                <div className="pcc-legend-item">
                  <span><span className="pcc-legend-dot" style={{ background: '#52B788' }} /> Preventative Medication</span>
                  <span className="pcc-legend-val">{formatINR(calculations.preventativeCost)}</span>
                </div>
                <div className="pcc-legend-item">
                  <span><span className="pcc-legend-dot" style={{ background: '#BC6C25' }} /> Emergency Medical Reserve</span>
                  <span className="pcc-legend-val">{formatINR(calculations.bufferCost)}</span>
                </div>
                <div className="pcc-legend-item">
                  <span><span className="pcc-legend-dot" style={{ background: '#74C69D' }} /> Grooming Care</span>
                  <span className="pcc-legend-val">{formatINR(calculations.groomingCost)}</span>
                </div>
                <div className="pcc-legend-item">
                  <span><span className="pcc-legend-dot" style={{ background: '#DDA15E' }} /> Treats, Chews &amp; Toys</span>
                  <span className="pcc-legend-val">{formatINR(calculations.monthlySupplies)}</span>
                </div>
              </div>
            </div>

            {/* Smart Shelter Value Proposition */}
            <div className="pcc-advice-card">
              <h4 className="pcc-advice-title">
                <TrendingDown size={16} /> Shelter Adoption Value Advantage
              </h4>
              <p className="pcc-advice-desc">
                Adopting from a verified rescue shelter saves up to <strong>₹12,000+</strong> upfront. Most rescue pets arrive already spayed/neutered, microchipped, and vaccinated by shelter veterinarians.
              </p>
            </div>

            {/* Print & Action Buttons */}
            <div className="pcc-summary-actions">
              <button
                type="button"
                className="pcc-btn-print"
                onClick={handlePrint}
              >
                <Printer size={16} /> Print / Save Budget Plan (PDF)
              </button>

              <Link
                to={`/pets?maxBudget=${calculations.monthlyTotal}`}
                className="ap-btn-primary"
                style={{ textAlign: 'center', textDecoration: 'none' }}
              >
                🐾 Find Pets Matching This Budget ({formatINR(calculations.monthlyTotal)}/mo)
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetCostCalculatorPage;
