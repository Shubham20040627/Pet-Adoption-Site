import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { commonApi } from '../api/commonApi';
import '../styles/about-contact.css';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Adoption Inquiry',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await commonApi.sendContactMessage(formData);
      setSuccessMsg(res.message || 'Thank you! Your message was saved in MongoDB.');
      setFormData({
        name: '',
        email: '',
        subject: 'General Adoption Inquiry',
        message: '',
      });
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section className="about-hero">
        <div className="container" style={{ maxWidth: '640px' }}>
          <span className="section-subtitle">Reach Out</span>
          <h1 style={{ color: 'var(--color-primary)', fontSize: '2.6rem', marginBottom: '0.75rem' }}>
            Contact PawConnect
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Have questions about an adoption application or shelter registration? Send us a message and our team will get in touch.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: '960px' }}>
          <div className="contact-grid">
            {/* Left Contact Info */}
            <div className="contact-info-card">
              <h3 style={{ color: 'var(--color-primary)', marginBottom: '1.25rem' }}>
                Contact Information
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                We are dedicated to supporting adopters and shelters throughout the entire adoption process.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', boxShadow: 'var(--shadow-xs)' }}>
                    <Mail size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Email Inquiries</div>
                    <strong style={{ color: 'var(--color-primary)', fontSize: '0.95rem' }}>support@pawconnect.org</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', boxShadow: 'var(--shadow-xs)' }}>
                    <Phone size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Helpline Phone</div>
                    <strong style={{ color: 'var(--color-primary)', fontSize: '0.95rem' }}>+1 (800) 555-PAWS (7297)</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', boxShadow: 'var(--shadow-xs)' }}>
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Campus / Project Office</div>
                    <strong style={{ color: 'var(--color-primary)', fontSize: '0.95rem' }}>Department of CSE, B.Tech Campus</strong>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '2.5rem', padding: '1rem', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary-border)', fontSize: '0.85rem', color: 'var(--color-primary)' }}>
                <strong>Database Persistence:</strong> All messages sent through this form are stored in the MongoDB <code>contact_messages</code> collection.
              </div>
            </div>

            {/* Right Contact Form */}
            <div className="card" style={{ padding: '2.5rem', backgroundColor: '#FFFFFF' }}>
              <h3 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                Send us a Message
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Fill in the form below and we will respond promptly.
              </p>

              {successMsg && (
                <div className="alert alert-success">
                  <CheckCircle2 size={18} />
                  <div>{successMsg}</div>
                </div>
              )}

              {errorMsg && (
                <div className="alert alert-error">
                  <AlertCircle size={18} />
                  <div>{errorMsg}</div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Your Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    placeholder="e.g. Alex Morgan"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    placeholder="e.g. alex@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select
                    name="subject"
                    className="form-select"
                    value={formData.subject}
                    onChange={handleChange}
                  >
                    <option value="General Adoption Inquiry">General Adoption Inquiry</option>
                    <option value="Shelter Partnership Request">Shelter Partnership Request</option>
                    <option value="Application Follow-up">Application Follow-up</option>
                    <option value="Technical or Website Feedback">Technical or Website Feedback</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Your Message *</label>
                  <textarea
                    name="message"
                    className="form-textarea"
                    placeholder="Write your questions or message here..."
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: '0.5rem' }}
                  disabled={loading}
                >
                  {loading ? 'Submitting to MongoDB...' : (
                    <>
                      <Send size={18} /> Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
