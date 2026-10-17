import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Award, CheckCircle2, ChevronRight, ArrowLeft, RotateCcw, 
  Sparkles, Check, Heart, HelpCircle, FileCheck2, ExternalLink, Printer 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdopterHeader from '../components/AdopterHeader';
import VerifiedAdopterBadgeCard from '../components/VerifiedAdopterBadgeCard';
import '../styles/adopter-portal.css';
import '../styles/readiness-assessment.css';

// 5 Professional, Classroom-Appropriate Scenarios
const QUESTIONS = [
  {
    id: 1,
    tag: 'Daily Schedule & Care',
    question: 'How do you plan to balance daily feeding routines, exercise, outdoor walks, and active companionship?',
    desc: 'Pets thrive on consistent daily routines for exercise, feeding, grooming, and mental stimulation.',
    options: [
      {
        id: 'A',
        title: 'Dedicated Daily Schedule',
        desc: 'I have scheduled time set aside each morning and evening for feeding, outdoor walks, grooming, and quality companionship.',
        points: 20,
        feedback: 'Excellent! Regular schedules help rescue animals feel secure, relaxed, and physically healthy.'
      },
      {
        id: 'B',
        title: 'Flexible Ad-Hoc Routine',
        desc: 'I will attend to pet care whenever I have free time between work or classes without a fixed schedule.',
        points: 10,
        feedback: 'Good intention, but establishing predictable daily hours significantly reduces behavioral stress in rescue animals.'
      },
      {
        id: 'C',
        title: 'Minimal Daily Involvement',
        desc: 'I assume pets mostly take care of themselves and only need a few minutes of attention daily.',
        points: 0,
        feedback: 'Pets require active daily companionship, social stimulation, and regular exercise to stay healthy and happy.'
      }
    ]
  },
  {
    id: 2,
    tag: 'Healthcare & Nutrition Budget',
    question: 'Veterinary care includes annual vaccinations, preventive wellness checks, and emergency medical reserves. What is your financial approach?',
    desc: 'Responsible adoption requires planning for both everyday nutrition and unexpected veterinary care.',
    options: [
      {
        id: 'A',
        title: 'Comprehensive Budget & Emergency Reserves',
        desc: 'I have set aside a dedicated budget for premium nutrition, annual vaccinations, and an emergency medical fund.',
        points: 20,
        feedback: 'Outstanding! Preventive medicine and emergency preparedness prevent financial distress during health emergencies.'
      },
      {
        id: 'B',
        title: 'Pay-As-You-Go Planning',
        desc: 'I plan to cover veterinary fees as they arise, but do not have an emergency medical reserve yet.',
        points: 10,
        feedback: 'Having an emergency medical reserve is recommended so unexpected treatments or tests are never delayed.'
      },
      {
        id: 'C',
        title: 'No Medical Budget Planned',
        desc: 'I have not yet factored medical or nutritional costs into my monthly expenses.',
        points: 0,
        feedback: 'Routine vaccinations and preventive vet visits are essential parts of humane pet guardianship.'
      }
    ]
  },
  {
    id: 3,
    tag: 'Patience & Adjustment (The 3-3-3 Rule)',
    question: 'Rescue animals often require a quiet period to adjust and decompress when arriving in a new home. How will you support their transition?',
    desc: 'The animal welfare 3-3-3 rule explains the decompression timeline: 3 days of feeling overwhelmed, 3 weeks settling into routines, and 3 months feeling at home.',
    options: [
      {
        id: 'A',
        title: 'Patient Decompression & Positive Reinforcement',
        desc: 'I will give them a calm, quiet sanctuary space, follow the 3-3-3 decompression rule, and use gentle positive reinforcement.',
        points: 20,
        feedback: 'Spot on! Allowing rescue pets space to decompress creates lasting trust and reduces anxiety.'
      },
      {
        id: 'B',
        title: 'Immediate Social Introductions',
        desc: 'I plan to introduce them to large gatherings, loud parks, and many unfamiliar animals on their first weekend.',
        points: 5,
        feedback: 'Too much stimulation early on can overwhelm a rescue pet. Gradual, quiet introductions are far safer.'
      },
      {
        id: 'C',
        title: 'Expecting Instant Perfection',
        desc: 'I expect the rescue pet to be completely comfortable and perfectly trained within the first 24 hours.',
        points: 0,
        feedback: 'Rescue pets need time, patience, and gentle guidance to adapt to unfamiliar surroundings.'
      }
    ]
  },
  {
    id: 4,
    tag: 'Home Safety & Household Agreement',
    question: 'Pet-friendly homes require hazard removal (toxic plants, exposed cables, unsecured balconies) and unanimous agreement among household members. What is your status?',
    desc: 'Unanimous family support and physical home safety prevent accidental injuries and pet surrender.',
    options: [
      {
        id: 'A',
        title: 'Household Consensus & Thorough Pet-Proofing',
        desc: 'Everyone in my home agrees enthusiastically, and we have checked the living area for safety and secure boundaries.',
        points: 20,
        feedback: 'Terrific! Unanimous household agreement is one of the highest predictors of adoption longevity.'
      },
      {
        id: 'B',
        title: 'Partial Consensus',
        desc: 'Some family members or roommates are unsure or hesitant about having an animal in the home.',
        points: 10,
        feedback: 'We recommend discussing daily responsibilities openly with everyone before bringing a rescue pet home.'
      },
      {
        id: 'C',
        title: 'Undiscussed with Housemates / Landlord',
        desc: 'I have not discussed the adoption with my landlord, family members, or housemates.',
        points: 0,
        feedback: 'Adopting without household or landlord permission often leads to heartbreaking pet returns.'
      }
    ]
  },
  {
    id: 5,
    tag: 'Lifelong Care & Responsibility',
    question: 'Adopting a pet is a 10 to 15+ year lifelong companionship through life events (relocations, career transitions, lifestyle changes). How do you view this journey?',
    desc: 'Pets form deep emotional attachments to their guardians and rely on them for their entire natural lifespan.',
    options: [
      {
        id: 'A',
        title: 'Permanent Family Commitment',
        desc: 'I consider adoption a permanent lifelong responsibility and will ensure my pet remains with me through all future transitions.',
        points: 20,
        feedback: 'Inspiring! True pet parenthood means committing through moves, career shifts, and family changes.'
      },
      {
        id: 'B',
        title: 'Conditional Depending on Convenience',
        desc: 'I will keep the pet as long as my current job and living situation remain unchanged.',
        points: 5,
        feedback: 'Consider that lifestyle transitions will happen. Having plans to accommodate your pet ensures lifelong security.'
      },
      {
        id: 'C',
        title: 'Short-Term Perspective',
        desc: 'I am only looking for short-term pet companionship for a few months.',
        points: 0,
        feedback: 'Fostering is a better alternative for short-term care. Adoption is intended as a permanent forever home.'
      }
    ]
  }
];

const ReadinessChecklistPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State: current step, selected answers, whether certificate is earned
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasPassed, setHasPassed] = useState(false);
  const [certData, setCertData] = useState(null);

  // Load existing certification from localStorage if already cleared
  useEffect(() => {
    try {
      const savedVerified = localStorage.getItem('pawconnect_readiness_verified');
      const savedCert = localStorage.getItem('pawconnect_readiness_cert');
      if (savedVerified === 'true' && savedCert) {
        const parsed = JSON.parse(savedCert);
        setCertData(parsed);
        setHasPassed(parsed.passed !== false);
        setIsCompleted(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const currentQ = QUESTIONS[currentStep];
  const selectedOptionId = selectedAnswers[currentStep];
  const selectedOption = currentQ?.options.find(o => o.id === selectedOptionId);

  const handleSelectOption = (optionId) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentStep]: optionId
    }));
  };

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Calculate final score & collect improvement areas
      let totalScore = 0;
      const failedRecommendations = [];

      QUESTIONS.forEach((q, idx) => {
        const chosenId = selectedAnswers[idx];
        const opt = q.options.find(o => o.id === chosenId);
        if (opt) {
          totalScore += opt.points;
          if (opt.points < 20) {
            failedRecommendations.push({
              tag: q.tag,
              question: q.question,
              chosenTitle: opt.title,
              feedback: opt.feedback
            });
          }
        }
      });

      const passed = totalScore >= 80;

      if (passed) {
        // Issue official certificate
        const cert = {
          certId: `PC-READY-${Math.floor(100000 + Math.random() * 900000)}`,
          userName: user?.name || user?.full_name || 'Alex Morgan',
          issueDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          score: totalScore,
          status: 'PawConnect Certified Ready Adopter',
          passed: true
        };

        try {
          localStorage.setItem('pawconnect_readiness_verified', 'true');
          localStorage.setItem('pawconnect_readiness_cert', JSON.stringify(cert));
        } catch (e) {
          console.error(e);
        }

        setCertData(cert);
        setHasPassed(true);
        setIsCompleted(true);
      } else {
        // Did not meet the 80% passing requirement
        const cert = {
          score: totalScore,
          recommendations: failedRecommendations,
          passed: false
        };

        try {
          localStorage.removeItem('pawconnect_readiness_verified');
          localStorage.removeItem('pawconnect_readiness_cert');
        } catch (e) {
          console.error(e);
        }

        setCertData(cert);
        setHasPassed(false);
        setIsCompleted(true);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleRetake = () => {
    try {
      localStorage.removeItem('pawconnect_readiness_verified');
      localStorage.removeItem('pawconnect_readiness_cert');
    } catch (e) {
      console.error(e);
    }
    setSelectedAnswers({});
    setCurrentStep(0);
    setIsCompleted(false);
    setHasPassed(false);
    setCertData(null);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="ap-page">
      <AdopterHeader hideSearch={true} />

      <div className="ap-wrap">
        <div className="assessment-container">
          {/* Top Header */}
          <div className="assessment-header">
            <span className="assessment-badge-pill">
              <ShieldCheck size={16} /> PawConnect Standards
            </span>
            <h1 className="assessment-title">Adoption Readiness Assessment</h1>
            <p className="assessment-subtitle">
              Complete this 2-minute evaluation to demonstrate responsible pet parenting and earn your official <strong>PawConnect Verified Adopter Badge</strong>.
            </p>
          </div>

          {!isCompleted ? (
            /* ================= QUESTIONNAIRE STEP ================= */
            <div className="assessment-card">
              {/* Progress bar */}
              <div className="assessment-progress-wrapper">
                <div className="assessment-progress-meta">
                  <span>Question {currentStep + 1} of {QUESTIONS.length}</span>
                  <span>{Math.round(((currentStep + 1) / QUESTIONS.length) * 100)}% Completed</span>
                </div>
                <div className="assessment-progress-bar-track">
                  <div 
                    className="assessment-progress-bar-fill" 
                    style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Tag & Question */}
              <div className="assessment-question-tag">{currentQ.tag}</div>
              <h2 className="assessment-question-text">{currentQ.question}</h2>
              <p className="assessment-question-desc">{currentQ.desc}</p>

              {/* Options */}
              <div className="assessment-options-grid">
                {currentQ.options.map(option => {
                  const isSelected = selectedOptionId === option.id;
                  return (
                    <div
                      key={option.id}
                      className={`assessment-option-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectOption(option.id)}
                    >
                      <div className="assessment-radio-dot">
                        {isSelected && <div className="assessment-radio-inner" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="assessment-option-label">{option.title}</div>
                        <div className="assessment-option-desc">{option.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Educational Feedback Box */}
              {selectedOption && (
                <div className="assessment-feedback-box">
                  <Sparkles size={18} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div className="assessment-feedback-text">
                    <strong>PawConnect Guidance:</strong> {selectedOption.feedback}
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="assessment-nav-row">
                <button
                  type="button"
                  className="assessment-btn-back"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  style={{ opacity: currentStep === 0 ? 0.4 : 1, cursor: currentStep === 0 ? 'default' : 'pointer' }}
                >
                  <ArrowLeft size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Previous
                </button>

                <button
                  type="button"
                  className="assessment-btn-next"
                  onClick={handleNext}
                  disabled={!selectedOptionId}
                >
                  {currentStep === QUESTIONS.length - 1 ? (
                    <>Complete &amp; Earn Badge <Award size={18} /></>
                  ) : (
                    <>Next Question <ChevronRight size={18} /></>
                  )}
                </button>
              </div>
            </div>
          ) : hasPassed ? (
            /* ================= OFFICAL CERTIFICATE & VERIFIED BADGE VIEW ================= */
            <div className="assessment-cert-card">
              <div className="cert-seal-icon">
                <Award size={38} />
              </div>

              <h2 className="cert-title">Congratulations! You’re Verified!</h2>
              <p className="cert-subtitle">
                You have successfully cleared the <strong>PawConnect Adoption Readiness Assessment</strong> with a score of <strong>{certData?.score || 100}%</strong>.
              </p>

              {/* Premium Badge Showcase */}
              <div style={{ margin: '0 auto 2rem auto', maxWidth: 680 }}>
                <VerifiedAdopterBadgeCard certData={certData} />
              </div>

              {/* Certificate Metadata */}
              <div className="cert-meta-grid">
                <div>
                  <div className="cert-meta-label">Certified Adopter</div>
                  <div className="cert-meta-val">{certData?.userName || 'Alex Morgan'}</div>
                </div>
                <div>
                  <div className="cert-meta-label">Credential ID</div>
                  <div className="cert-meta-val" style={{ fontFamily: 'monospace' }}>{certData?.certId || 'PC-READY-918234'}</div>
                </div>
                <div>
                  <div className="cert-meta-label">Issue Date</div>
                  <div className="cert-meta-val">{certData?.issueDate || '17 Oct 2026'}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="cert-actions-row">
                <button
                  type="button"
                  className="assessment-btn-next"
                  onClick={() => navigate('/pets')}
                >
                  🐾 Browse Pets with Verified Status
                </button>

                <button
                  type="button"
                  className="assessment-btn-back"
                  onClick={handlePrint}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <Printer size={16} /> Print Official Certificate
                </button>

                <button
                  type="button"
                  className="assessment-btn-back"
                  onClick={handleRetake}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <RotateCcw size={15} /> Retake Assessment
                </button>
              </div>
            </div>
          ) : (
            /* ================= NEEDS PREPARATION / BELOW THRESHOLD VIEW ================= */
            <div className="assessment-fail-card">
              <div className="fail-seal-icon">
                <HelpCircle size={38} />
              </div>

              <div className="fail-score-pill">
                Your Score: {certData?.score || 0}% • Passing Threshold: 80%
              </div>

              <h2 className="cert-title" style={{ color: '#92400E' }}>Needs Further Preparation</h2>
              <p className="cert-subtitle">
                A minimum score of <strong>80%</strong> is required to earn the official <strong>PawConnect Verified Ready Adopter</strong> badge. Pet adoption is a long-term commitment that requires structured routines and emergency veterinary planning.
              </p>

              {/* Recommendations list */}
              {certData?.recommendations && certData.recommendations.length > 0 && (
                <div className="fail-recommendations-list">
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#78350F', marginBottom: '0.25rem' }}>
                    Key Areas to Strengthen Before Re-evaluating:
                  </div>
                  {certData.recommendations.map((rec, i) => (
                    <div key={i} className="fail-rec-item">
                      <Sparkles size={18} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div className="fail-rec-text">
                        <strong>{rec.tag}:</strong> {rec.feedback}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="cert-actions-row">
                <button
                  type="button"
                  className="assessment-btn-next"
                  onClick={handleRetake}
                  style={{ background: 'linear-gradient(135deg, #B45309 0%, #D97706 100%)' }}
                >
                  <RotateCcw size={16} /> Review Answers &amp; Retake Assessment
                </button>

                <Link
                  to="/about"
                  className="assessment-btn-back"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <ExternalLink size={15} /> Read Adoption Preparation Guide
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReadinessChecklistPage;
