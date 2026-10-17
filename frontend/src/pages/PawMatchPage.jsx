import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, PawPrint, ArrowLeft, Heart, CheckCircle2, Layers, MapPin } from 'lucide-react';
import { petsApi } from '../api/petsApi';
import AdopterHeader from '../components/AdopterHeader';
import '../styles/adopter-portal.css';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80';

const QUESTIONS = [
  {
    id: 1,
    question: 'What type of home do you live in?',
    options: [
      { emoji: '🏢', title: 'Apartment', sub: 'No outdoor space' },
      { emoji: '🏠', title: 'House', sub: 'With small yard' },
      { emoji: '🌿', title: 'Farm / Rural', sub: 'Lots of outdoor space' },
    ],
  },
  {
    id: 2,
    question: 'What size pet would suit your lifestyle?',
    options: [
      { emoji: '🐕', title: 'Small', sub: 'Up to 10 kg' },
      { emoji: '🦮', title: 'Medium', sub: '10–25 kg' },
      { emoji: '🐕‍🦺', title: 'Large', sub: 'Above 25 kg' },
    ],
  },
  {
    id: 3,
    question: 'How active is your daily lifestyle?',
    options: [
      { emoji: '🛋️', title: 'Relaxed', sub: 'Mostly indoors' },
      { emoji: '🚶', title: 'Moderate', sub: '1–2 walks daily' },
      { emoji: '🏃', title: 'Very Active', sub: 'Exercise & outdoor activities' },
    ],
  },
  {
    id: 4,
    question: 'Do you have children or other pets at home?',
    options: [
      { emoji: '👶', title: 'Young Kids', sub: 'Children under 10' },
      { emoji: '🐱', title: 'Other Pets', sub: 'Cats, dogs, or both' },
      { emoji: '🧑‍🤝‍🧑', title: 'Neither', sub: 'No kids or other pets' },
    ],
  },
  {
    id: 5,
    question: 'How much time can you dedicate to your pet daily?',
    options: [
      { emoji: '⏱️', title: 'Low', sub: '1–2 hours' },
      { emoji: '⏰', title: 'Moderate', sub: '2–5 hours' },
      { emoji: '🕐', title: 'High', sub: '5+ hours' },
    ],
  },
];

const PawMatchPage = () => {
  const navigate = useNavigate();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isComplete, setIsComplete] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [availablePets, setAvailablePets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);

  // Fetch real available pets from database
  useEffect(() => {
    const fetchPets = async () => {
      setLoadingPets(true);
      try {
        const res = await petsApi.list({ status: 'available' });
        setAvailablePets(res.pets || []);
      } catch (err) {
        console.error('Failed to load pets for PawMatch:', err);
      } finally {
        setLoadingPets(false);
      }
    };
    fetchPets();
  }, []);

  const q = QUESTIONS[currentQ];
  const totalQ = QUESTIONS.length;
  const pct = Math.round(((currentQ + 1) / totalQ) * 100);

  const handleSelect = (opt) => {
    setSelectedOpt(opt.title);
    setAnswers(prev => ({ ...prev, [q.id]: opt.title }));
  };

  const handleNext = () => {
    if (currentQ < totalQ - 1) {
      const nextIndex = currentQ + 1;
      setCurrentQ(nextIndex);
      const nextQ = QUESTIONS[nextIndex];
      setSelectedOpt(answers[nextQ.id] || null);
    } else {
      setIsComplete(true);
      try {
        localStorage.setItem('pawconnect_pawmatch_answers', JSON.stringify(answers));
      } catch (e) {}
    }
  };

  const handleBack = () => {
    if (currentQ > 0) {
      const prevIndex = currentQ - 1;
      setCurrentQ(prevIndex);
      const prevQ = QUESTIONS[prevIndex];
      setSelectedOpt(answers[prevQ.id] || null);
    }
  };

  const handleRestart = () => {
    setCurrentQ(0);
    setAnswers({});
    setIsComplete(false);
    setSelectedOpt(null);
  };

  // Evaluate real database pets against user's quiz answers
  const scoredPets = useMemo(() => {
    if (!isComplete || availablePets.length === 0) return [];

    const home = answers[1] || 'House';
    const size = answers[2] || 'Medium';
    const activity = answers[3] || 'Moderate';
    const household = answers[4] || 'Neither';
    const time = answers[5] || 'Moderate';

    const results = availablePets.map(pet => {
      let score = 50; // base score
      let reasons = [];

      const species = (pet.species || '').toLowerCase();
      const petSize = (pet.size || 'Medium').toLowerCase();
      const energy = (pet.energy_level || pet.activity_level || 'Moderate').toLowerCase();

      // 1. Home compatibility
      if (home === 'Apartment') {
        if (species === 'cat' || species === 'rabbit' || species === 'bird' || petSize === 'small') {
          score += 15;
          reasons.push('Comfortable with apartment living');
        } else if (energy.includes('high')) {
          score -= 10;
        }
      } else if (home === 'House' || home === 'Farm / Rural') {
        if (energy.includes('high') || petSize === 'large' || petSize === 'medium') {
          score += 15;
          reasons.push('Thrives with yard and outdoor space');
        } else {
          score += 10;
        }
      }

      // 2. Size match
      if (size.toLowerCase() === petSize) {
        score += 15;
        reasons.push(`Matches your preferred ${pet.size || size} size`);
      }

      // 3. Activity match
      if (activity === 'Very Active' && energy.includes('high')) {
        score += 15;
        reasons.push('High energy companion for your active lifestyle');
      } else if (activity === 'Relaxed' && (energy.includes('low') || species === 'cat')) {
        score += 15;
        reasons.push('Calm and relaxed temperament suited for indoor downtime');
      } else if (activity === 'Moderate' && energy.includes('mod')) {
        score += 15;
        reasons.push('Balanced daily activity requirement');
      }

      // 4. Household members (Kids / Other Pets)
      if (household === 'Young Kids') {
        if (pet.good_with_kids) {
          score += 15;
          reasons.push('Gentle and well-socialized with children');
        } else if (pet.good_with_kids === false) {
          score -= 25;
        }
      }

      if (household === 'Other Pets') {
        if (pet.good_with_pets === true || String(pet.good_with_pets).toLowerCase() === 'yes') {
          score += 15;
          reasons.push('Friendly and compatible with other animals');
        }
      }

      // 5. Time commitment
      if (time === 'Low' && (species === 'cat' || energy.includes('low'))) {
        score += 10;
        reasons.push('Independent companion that handles quiet time well');
      } else if (time === 'High') {
        score += 10;
      }

      // Clamp score between 65% and 99%
      const matchPct = Math.min(Math.max(score, 65), 98);

      return {
        pet,
        matchPct,
        reasonSummary: reasons.slice(0, 2).join(' • ') || 'Good match for your household preferences',
      };
    });

    // Sort by match percentage descending
    results.sort((a, b) => b.matchPct - a.matchPct);
    return results;
  }, [isComplete, availablePets, answers]);

  const handleComparePet = (petId) => {
    try {
      const stored = localStorage.getItem('pawconnect_compare_ids');
      let ids = stored ? JSON.parse(stored) : [];
      if (!ids.includes(petId)) {
        if (ids.length >= 3) ids.shift();
        ids.push(petId);
        localStorage.setItem('pawconnect_compare_ids', JSON.stringify(ids));
      }
      navigate(`/compare-pets?pets=${ids.join(',')}`);
    } catch {
      navigate(`/compare-pets?pets=${petId}`);
    }
  };

  if (isComplete) {
    return (
      <div className="ap-page">
        <AdopterHeader hideSearch={true} />
        <div className="ap-wrap" style={{ maxWidth: 860, paddingTop: '1.5rem' }}>
          <div className="ap-page-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#E8F5E9', color: '#166534', padding: '0.4rem 0.9rem', borderRadius: 20, fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              <Sparkles size={16} /> Real-Time Database Matches
            </div>
            <h1 className="ap-page-title" style={{ justifyContent: 'center', fontSize: '1.8rem', margin: '0 0 0.5rem' }}>
              Your Best Pet Matches!
            </h1>
            <p className="ap-page-subtitle" style={{ maxWidth: 560, margin: '0 auto' }}>
              We analyzed all rescue pets currently in the shelter database against your 5 lifestyle responses. Here are the top matches available for adoption right now:
            </p>
          </div>

          {loadingPets ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#5A7167' }}>
              <PawPrint size={40} style={{ margin: '0 auto 1rem', color: '#174C38', animation: 'spin 2s linear infinite' }} />
              <div>Fetching real pets from shelter records...</div>
            </div>
          ) : scoredPets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#FFFFFF', borderRadius: 16, border: '1px solid #EDEBE6' }}>
              <PawPrint size={36} color="#7A9187" style={{ margin: '0 auto 1rem' }} />
              <h3>No matching pets found at this moment</h3>
              <p style={{ color: '#5A7167' }}>Try adjusting your preferences or retaking the quiz.</p>
              <button onClick={handleRestart} className="ap-btn-primary" style={{ marginTop: '1rem' }}>Take Quiz Again</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
              {scoredPets.slice(0, 4).map(({ pet, matchPct, reasonSummary }, idx) => {
                const photoSrc = pet.photo_url || pet.image_url || FALLBACK_IMG;
                const shelterLocation = pet.location || pet.shelter_name || pet.shelter?.shelter_name || 'Rescue Shelter';

                return (
                  <div
                    key={pet.id || idx}
                    style={{
                      background: '#FFFFFF',
                      border: idx === 0 ? '2px solid #2D6A4F' : '1px solid #E5DFD6',
                      borderRadius: 16,
                      padding: '1.25rem',
                      display: 'flex',
                      gap: '1.25rem',
                      alignItems: 'center',
                      boxShadow: idx === 0 ? '0 8px 24px rgba(45, 106, 79, 0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                      position: 'relative',
                      flexWrap: 'wrap',
                    }}
                  >
                    {/* Pet Image */}
                    <img
                      src={photoSrc}
                      alt={pet.name}
                      style={{
                        width: 130,
                        height: 130,
                        borderRadius: 12,
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                      onError={e => { e.target.src = FALLBACK_IMG; }}
                    />

                    {/* Pet Info */}
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#162620' }}>
                          {pet.name}
                        </h3>
                        <span style={{
                          background: '#E8F5E9',
                          color: '#166534',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: 12,
                        }}>
                          {pet.breed || pet.species}
                        </span>
                        <span style={{
                          background: '#FEF3C7',
                          color: '#B45309',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          padding: '0.2rem 0.65rem',
                          borderRadius: 12,
                          marginLeft: 'auto',
                        }}>
                          ✨ {matchPct}% Match
                        </span>
                      </div>

                      <div style={{ fontSize: '0.84rem', color: '#5A7167', display: 'flex', gap: '0.75rem', marginBottom: '0.55rem' }}>
                        <span>🎂 {pet.age ? `${pet.age} yrs` : 'Adult'}</span>
                        <span>•</span>
                        <span>⚥ {pet.gender || 'Unknown'}</span>
                        <span>•</span>
                        <span>📍 {shelterLocation}</span>
                      </div>

                      <div style={{ fontSize: '0.88rem', color: '#174C38', background: '#F8F5EF', padding: '0.5rem 0.75rem', borderRadius: 8, marginBottom: '0.85rem' }}>
                        <strong>Why it fits:</strong> {reasonSummary}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '0.65rem' }}>
                        <Link
                          to={`/pets/${pet.id}`}
                          className="ap-btn-primary"
                          style={{ fontSize: '0.84rem', padding: '0.45rem 0.95rem' }}
                        >
                          🐾 View Profile &amp; Apply
                        </Link>
                        <button
                          type="button"
                          className="ap-btn-secondary"
                          onClick={() => handleComparePet(pet.id)}
                          style={{ fontSize: '0.84rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <Layers size={14} /> Compare Traits
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ textAlign: 'center', paddingBottom: '3rem' }}>
            <button onClick={handleRestart} className="ap-btn-secondary" style={{ padding: '0.75rem 1.75rem' }}>
              🔄 Retake Quiz with Different Answers
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ap-page">
      <AdopterHeader hideSearch={true} />
      <div className="ap-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '1.5rem' }}>
        <div className="ap-page-header" style={{ textAlign: 'center', width: '100%' }}>
          <h1 className="ap-page-title" style={{ justifyContent: 'center' }}><Sparkles size={26} color="#174C38"/> PawMatch Quiz</h1>
          <p className="ap-page-subtitle">Answer 5 simple questions to discover real rescue pets matching your lifestyle.</p>
        </div>

        <div className="ap-quiz-card">
          {/* Progress Header */}
          <div className="ap-quiz-header">
            <div className="ap-quiz-step-row">
              <span className="ap-quiz-step-label">Question {currentQ + 1} of {totalQ}</span>
              <span className="ap-quiz-pct">{pct}%</span>
            </div>
            <div className="ap-quiz-progress-bar">
              <div className="ap-quiz-progress-fill" style={{ width: `${pct}%` }}/>
            </div>
          </div>

          {/* Question */}
          <div className="ap-quiz-question">{q.question}</div>

          {/* Options */}
          <div className="ap-quiz-opts-grid">
            {q.options.map((opt, i) => {
              const isSel = selectedOpt === opt.title;
              return (
                <button
                  key={i}
                  type="button"
                  className={`ap-quiz-opt${isSel ? ' selected' : ''}`}
                  onClick={() => handleSelect(opt)}
                >
                  <span className="ap-quiz-opt-emoji">{opt.emoji}</span>
                  <span className="ap-quiz-opt-title">{opt.title}</span>
                  <span className="ap-quiz-opt-sub">{opt.sub}</span>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="ap-quiz-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
            <button
              type="button"
              className="ap-btn-secondary"
              onClick={handleBack}
              disabled={currentQ === 0}
              style={{ opacity: currentQ === 0 ? 0.4 : 1 }}
            >
              ← Back
            </button>
            <button
              type="button"
              className="ap-btn-primary"
              onClick={handleNext}
              disabled={!selectedOpt}
            >
              {currentQ < totalQ - 1 ? 'Next →' : 'See Real Matches ✨'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PawMatchPage;
