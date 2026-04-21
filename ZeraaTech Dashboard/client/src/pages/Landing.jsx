import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { syncDocumentLanguage } from "../i18n";

const TEXT = {
  en: {
    brand: "ZeraaTech",
    heroTitle: "ZeraaTech — Smart Agriculture for Egyptian Farmers",
    heroDesc: "Empower your farm with real-time IoT monitoring, AI-driven disease detection, and localized crop recommendations to maximize your yield.",
    login: "Login",
    signup: "Sign Up",
    langToggle: "العربية",
    featuresTitle: "Why ZeraaTech?",
    features: [
      { title: "IoT Monitoring", desc: "Live sensor data for moisture, temperature, and soil pH." },
      { title: "AI Disease Detection", desc: "Instantly diagnose crop diseases using your smartphone camera." },
      { title: "Crop Recommendations", desc: "Data-driven insights to plant the right crops at the right time." },
      { title: "SMS Alerts", desc: "Receive immediate text notifications when sensor thresholds are breached." }
    ],
    howItWorksTitle: "How it works",
    steps: [
      { step: "1", title: "Install Sensors", desc: "Deploy ZeraaTech IoT nodes in your soil." },
      { step: "2", title: "Monitor Dashboard", desc: "Track live metrics and alerts anywhere." },
      { step: "3", title: "Get Recommendations", desc: "Use AI to detect diseases and optimize yield." }
    ],
    footer: "© 2026 ZeraaTech. Developed for Egyptian Agriculture."
  },
  ar: {
    brand: "زراعة-تك",
    heroTitle: "زراعة-تك — الزراعة الذكية للمزارع المصري",
    heroDesc: "قم بتمكين مزرعتك من خلال المراقبة الحية لإنترنت الأشياء، واكتشاف الأمراض بالذكاء الاصطناعي، وتوصيات المحاصيل المخصصة لزيادة إنتاجك.",
    login: "تسجيل الدخول",
    signup: "إنشاء حساب",
    langToggle: "English",
    featuresTitle: "لماذا زراعة-تك؟",
    features: [
      { title: "مراقبة إنترنت الأشياء", desc: "بيانات حية لرطوبة التربة، درجة الحرارة، ودرجة الحموضة." },
      { title: "كشف الأمراض بالذكاء الاصطناعي", desc: "شخص أمراض المحاصيل فوراً باستخدام كاميرا هاتفك الذكي." },
      { title: "توصيات المحاصيل", desc: "رؤى مبنية على البيانات لزراعة المحاصيل المناسبة في الوقت المناسب." },
      { title: "تنبيهات الرسائل القصيرة", desc: "تلقى إشعارات نصية فورية عند تجاوز حدود المستشعرات الآمنة." }
    ],
    howItWorksTitle: "كيف يعمل؟",
    steps: [
      { step: "1", title: "تثبيت المستشعرات", desc: "انشر أجهزة زراعة-تك في تربة مزرعتك." },
      { step: "2", title: "مراقبة لوحة القيادة", desc: "تتبع المؤشرات الحية والتنبيهات من أي مكان." },
      { step: "3", title: "الحصول على التوصيات", desc: "استخدم الذكاء الاصطناعي لكشف الأمراض وتحسين الإنتاج." }
    ],
    footer: "© 2026 زراعة-تك. تم تطويره من أجل الزراعة المصرية."
  }
};

export default function Landing() {
  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");
  const t = TEXT[lang];

  useEffect(() => {
    syncDocumentLanguage(lang);
  }, [lang]);

  const toggleLang = () => {
    const next = lang === "en" ? "ar" : "en";
    setLang(next);
    localStorage.setItem("lang", next);
  };

  return (
    <div className="landing-wrap" dir={lang === "ar" ? "rtl" : "ltr"}>
      <header className="landing-nav">
        <div className="brand">
          <div className="logo" />
          <span style={{ fontWeight: "800", fontSize: "1.5em", marginLeft: "6px", color: "var(--accent)" }}>
            {t.brand}
          </span>
        </div>
        <div className="landing-nav-actions">
          <button className="btn ghost" onClick={toggleLang} style={{ color: "var(--text)" }}>
            {t.langToggle}
          </button>
          <Link to="/login" className="btn ghost" style={{ textDecoration: "none", color: "var(--text)" }}>
            {t.login}
          </Link>
          <Link to="/signup" className="btn" style={{ textDecoration: "none" }}>
            {t.signup}
          </Link>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <h1 className="hero-title">{t.heroTitle}</h1>
            <p className="hero-desc">{t.heroDesc}</p>
            <div className="hero-cta">
              <Link to="/signup" className="btn large-btn" style={{ textDecoration: "none" }}>
                {t.signup}
              </Link>
            </div>
          </div>
        </section>

        <section className="features-section">
          <h2 className="section-title">{t.featuresTitle}</h2>
          <div className="features-grid">
            {t.features.map((feature, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon-wrap">
                  <div className="feature-icon" />
                </div>
                <h3>{feature.title}</h3>
                <p className="muted">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="how-it-works-section">
          <h2 className="section-title">{t.howItWorksTitle}</h2>
          <div className="steps-container">
            {t.steps.map((step, i) => (
              <div key={i} className="step-card">
                <div className="step-number">{step.step}</div>
                <h3>{step.title}</h3>
                <p className="muted">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p className="muted">{t.footer}</p>
      </footer>
    </div>
  );
}
