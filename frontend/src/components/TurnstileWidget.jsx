import React, { useEffect, useRef, useState } from 'react';

/**
 * Cloudflare Turnstile Widget Component ("The Tick Thing" ✔)
 * 
 * Production integration with live Cloudflare Turnstile keys:
 * Site Key: 0x4AAAAAAFzmIJA13HPq4SDV
 */
const TurnstileWidget = ({
  siteKey = '0x4AAAAAAFzmIJA13HPq4SDV', // Your live Cloudflare Turnstile Site Key
  onVerify,
  onExpire,
  onError,
  theme = 'light',
  className = '',
}) => {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Keep latest callbacks in refs to avoid re-triggering during parent re-renders
  const onVerifyRef = useRef(onVerify);
  onVerifyRef.current = onVerify;

  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    let intervalId = null;
    let timeoutId = null;
    let isDisposed = false;

    const renderWidget = () => {
      if (isDisposed || !containerRef.current) return;
      if (widgetIdRef.current !== null) return;

      if (window.turnstile && typeof window.turnstile.render === 'function') {
        try {
          containerRef.current.innerHTML = '';
          const id = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            theme: theme,
            callback: (token) => {
              setErrorMessage('');
              if (onVerifyRef.current) onVerifyRef.current(token);
            },
            'expired-callback': () => {
              if (onExpireRef.current) onExpireRef.current();
            },
            'error-callback': (code) => {
              console.warn('[Cloudflare Turnstile Error]:', code);
              if (code === '110600') {
                setErrorMessage(
                  "Domain mismatch: Please ensure 'localhost' is listed under Domains in your Cloudflare Turnstile settings."
                );
              } else {
                setErrorMessage(`Verification error (Code: ${code})`);
              }
              if (onErrorRef.current) onErrorRef.current(code);
            },
          });
          widgetIdRef.current = id;
        } catch (err) {
          console.warn('[Turnstile] Render error:', err);
        }
      }
    };

    // 1. Render immediately if ready
    if (window.turnstile && typeof window.turnstile.render === 'function') {
      renderWidget();
    }

    // 2. Listen to global loaded event
    const handleLoaded = () => renderWidget();
    window.addEventListener('turnstile-loaded', handleLoaded);

    // 3. Fallback active poll
    intervalId = setInterval(() => {
      if (window.turnstile && typeof window.turnstile.render === 'function') {
        clearInterval(intervalId);
        renderWidget();
      }
    }, 100);

    timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      if (!window.turnstile) {
        setErrorMessage(
          'Could not load Cloudflare verification script. Please check your internet connection or pause ad blockers.'
        );
      }
    }, 6000);

    return () => {
      isDisposed = true;
      window.removeEventListener('turnstile-loaded', handleLoaded);
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
      if (window.turnstile && widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {}
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, theme]);

  return (
    <div
      className={`turnstile-widget-wrapper ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '12px 0 8px 0',
        minHeight: '65px',
      }}
    >
      <div ref={containerRef} />

      {errorMessage && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            fontSize: '12px',
            color: '#b91c1c',
            backgroundColor: '#fef2f2',
            borderRadius: '6px',
            border: '1px solid #fecaca',
            maxWidth: '380px',
            textAlign: 'center',
            lineHeight: '1.4',
          }}
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default TurnstileWidget;
