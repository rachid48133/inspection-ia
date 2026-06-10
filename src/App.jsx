import { useState, useRef, useCallback, useEffect } from "react";

// ─── Palette & Design ────────────────────────────────────────────────────────
// Fond sombre "tableau de bord terrain" : #0F1923 (nuit chantier)
// Accent électrique : #F5A623 (orange haute-tension)
// Secondaire : #1E2D3D (ardoise)
// Texte : #E8EDF2 / #8A9BB0
// Danger : #E83B3B
// Succès : #2ECC71

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Inter:wght@400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #0F1923;
    color: #E8EDF2;
    font-family: 'Inter', sans-serif;
    min-height: 100vh;
  }

  .app {
    max-width: 480px;
    margin: 0 auto;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* Header */
  .header {
    padding: 16px 20px 12px;
    border-bottom: 1px solid #1E2D3D;
    display: flex;
    align-items: center;
    gap: 10px;
    position: sticky;
    top: 0;
    background: #0F1923;
    z-index: 10;
  }
  .header-icon {
    width: 34px; height: 34px;
    background: #F5A623;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
  }
  .header h1 {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: #E8EDF2;
  }
  .header span {
    font-size: 11px;
    color: #8A9BB0;
    font-family: 'IBM Plex Mono', monospace;
  }

  /* Main scroll zone */
  .main { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }

  /* Cards */
  .card {
    background: #1E2D3D;
    border-radius: 12px;
    padding: 16px;
    border: 1px solid #2A3F54;
  }
  .card-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #F5A623;
    margin-bottom: 10px;
    font-family: 'IBM Plex Mono', monospace;
  }

  /* Champs */
  .field-row { display: flex; gap: 8px; }
  .select-input, .text-input {
    background: #0F1923;
    border: 1px solid #2A3F54;
    border-radius: 8px;
    color: #E8EDF2;
    font-size: 14px;
    padding: 10px 12px;
    width: 100%;
    font-family: 'Inter', sans-serif;
    outline: none;
    transition: border-color 0.15s;
  }
  .select-input:focus, .text-input:focus { border-color: #F5A623; }
  .text-input { resize: none; min-height: 80px; line-height: 1.5; }

  /* Bouton vocal */
  .vocal-btn {
    width: 100%;
    padding: 14px;
    border-radius: 10px;
    border: 2px solid #F5A623;
    background: transparent;
    color: #F5A623;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.15s;
    font-family: 'Inter', sans-serif;
  }
  .vocal-btn.recording {
    background: rgba(232,59,59,0.12);
    border-color: #E8373B;
    color: #E8373B;
    animation: pulse 1.4s infinite;
  }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }

  /* Upload photo */
  .photo-zone {
    border: 1.5px dashed #2A3F54;
    border-radius: 8px;
    padding: 14px;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.15s;
    color: #8A9BB0;
    font-size: 13px;
  }
  .photo-zone:hover { border-color: #F5A623; color: #F5A623; }
  .photo-thumb {
    display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px;
  }
  .photo-thumb img {
    width: 72px; height: 72px;
    object-fit: cover; border-radius: 6px;
    border: 1px solid #2A3F54;
  }

  /* Types de rapport */
  .report-types { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .type-btn {
    padding: 10px 8px;
    border-radius: 8px;
    border: 1px solid #2A3F54;
    background: #0F1923;
    color: #8A9BB0;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    text-align: center;
    transition: all 0.15s;
    font-family: 'Inter', sans-serif;
  }
  .type-btn.active {
    border-color: #F5A623;
    color: #F5A623;
    background: rgba(245,166,35,0.08);
  }
  .type-btn:hover:not(.active) { border-color: #3A5068; color: #E8EDF2; }

  /* Bouton générer */
  .generate-btn {
    width: 100%;
    padding: 16px;
    border-radius: 10px;
    border: none;
    background: #F5A623;
    color: #0F1923;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 0.02em;
    font-family: 'Inter', sans-serif;
    transition: opacity 0.15s;
  }
  .generate-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .generate-btn:not(:disabled):hover { opacity: 0.9; }

  /* Loading */
  .loading {
    display: flex; align-items: center; gap: 10px;
    color: #8A9BB0; font-size: 13px; padding: 8px 0;
    font-family: 'IBM Plex Mono', monospace;
  }
  .dot-spin { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Résultat */
  .result-card {
    background: #1E2D3D;
    border-radius: 12px;
    border: 1px solid #2A3F54;
    overflow: hidden;
  }
  .result-header {
    padding: 12px 16px;
    border-bottom: 1px solid #2A3F54;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .result-type {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #F5A623;
    font-family: 'IBM Plex Mono', monospace;
  }
  .copy-btn {
    background: transparent;
    border: 1px solid #2A3F54;
    border-radius: 6px;
    color: #8A9BB0;
    padding: 5px 10px;
    font-size: 11px;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: all 0.15s;
  }
  .copy-btn:hover { border-color: #F5A623; color: #F5A623; }
  .copy-btn.copied { border-color: #2ECC71; color: #2ECC71; }

  .result-body {
    padding: 16px;
    font-size: 13px;
    line-height: 1.7;
    color: #C8D5E0;
    white-space: pre-wrap;
    max-height: 420px;
    overflow-y: auto;
    font-family: 'Inter', sans-serif;
  }

  /* Historique */
  .history-item {
    padding: 10px 12px;
    border-radius: 8px;
    background: #0F1923;
    border: 1px solid #2A3F54;
    margin-bottom: 8px;
    cursor: pointer;
    transition: border-color 0.15s;
  }
  .history-item:hover { border-color: #3A5068; }
  .history-meta {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 3px;
  }
  .history-meta span:first-child {
    font-size: 12px; font-weight: 600; color: #E8EDF2;
  }
  .history-meta span:last-child {
    font-size: 10px; color: #8A9BB0;
    font-family: 'IBM Plex Mono', monospace;
  }
  .history-preview {
    font-size: 11px; color: #8A9BB0;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  /* Tabs */
  .tabs { display: flex; gap: 0; border-bottom: 1px solid #2A3F54; margin-bottom: 16px; }
  .tab {
    padding: 10px 16px; font-size: 13px; font-weight: 500;
    color: #8A9BB0; cursor: pointer; border-bottom: 2px solid transparent;
    transition: all 0.15s; background: none; border-top: none; border-left: none; border-right: none;
    font-family: 'Inter', sans-serif;
  }
  .tab.active { color: #F5A623; border-bottom-color: #F5A623; }

  /* Toast */
  .toast {
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    background: #2ECC71; color: #0F1923; padding: 10px 20px;
    border-radius: 8px; font-size: 13px; font-weight: 600;
    z-index: 100; font-family: 'Inter', sans-serif;
  }

  /* Badge type */
  .badge {
    display: inline-block; padding: 2px 7px; border-radius: 4px;
    font-size: 10px; font-weight: 600; font-family: 'IBM Plex Mono', monospace;
    background: rgba(245,166,35,0.15); color: #F5A623;
  }
`;

const BUILDING_TYPES = ["Maison", "Duplex", "Triplex", "Immeuble logements", "Commercial", "Industriel"];
const REPORT_TYPES = [
  { id: "description", label: "📋 Description" },
  { id: "resume", label: "📝 Résumé" },
  { id: "non_conformites", label: "⚠️ Non-conformités" },
  { id: "complet", label: "📄 Rapport complet" },
];

// ⚠️ Remplacer par ta clé Groq (gratuit sur console.groq.com)
const GROQ_KEY = "gsk_VOTRE_CLE_GROQ_ICI";

const SYSTEM_PROMPT = `Tu es un expert en inspection électrique selon les normes du Code de construction du Québec et le Code canadien de l'électricité.

À partir des observations fournies, génère un rapport professionnel structuré en français.
Vocabulaire technique : panneaux électriques, embases, branchements, circuits, transformateurs, conducteurs, protections, disjoncteurs, mises à la terre, DDFT, surtensionneurs.

Règles :
- Sois concis, précis, factuel et professionnel
- Utilise le vocabulaire d'un inspecteur en électricité
- Pour les non-conformités, indique le niveau de risque : CRITIQUE / MAJEUR / MINEUR
- Format structuré avec sections claires
- Pas de markdown avec des astérisques — utilise des tirets pour les listes`;

export default function InspectionIA() {
  const [tab, setTab] = useState("saisie");
  const [buildingType, setBuildingType] = useState("Maison");
  const [adresse, setAdresse] = useState("");
  const [observations, setObservations] = useState("");
  const [reportType, setReportType] = useState("complet");
  const [photos, setPhotos] = useState([]);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [recordingSecs, setRecordingSecs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── Vocal via MediaRecorder → Whisper ─────────────────────────────────────
  const toggleVocal = useCallback(async () => {
    if (recording) {
      // Stop → déclenche ondataavailable + onstop
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current?.stream?.getTracks().forEach(t => t.stop());
      clearInterval(timerRef.current);
      setRecording(false);
      setRecordingSecs(0);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Choisir le format supporté
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/webm";

      const mr = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        setTranscribing(true);
        try {
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          const ext = mimeType.includes("mp4") ? "m4a" : "webm";
          const formData = new FormData();
          formData.append("file", blob, `audio.${ext}`);
          formData.append("model", "whisper-large-v3-turbo");
          formData.append("language", "fr");

          const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
            method: "POST",
            headers: { Authorization: `Bearer ${GROQ_KEY}` },
            body: formData,
          });

          if (!res.ok) throw new Error(`Groq Whisper error ${res.status}`);
          const data = await res.json();
          const transcript = data.text?.trim();
          if (transcript) {
            setObservations(prev => prev ? prev + " " + transcript : transcript);
            showToast("✓ Transcription ajoutée");
          }
        } catch (err) {
          showToast("Erreur transcription : " + err.message);
        } finally {
          setTranscribing(false);
        }
      };

      mr.start(250); // chunk toutes les 250ms
      mediaRecorderRef.current = mr;
      setRecording(true);
      setRecordingSecs(0);
      timerRef.current = setInterval(() => setRecordingSecs(s => s + 1), 1000);

    } catch (err) {
      showToast("Micro inaccessible : " + err.message);
    }
  }, [recording]);

  // ── Photos ─────────────────────────────────────────────────────────────────
  const handlePhotos = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotos(prev => [...prev, { url: ev.target.result, name: file.name }]);
      reader.readAsDataURL(file);
    });
  };

  // ── Génération ─────────────────────────────────────────────────────────────
  const generate = async () => {
    if (!observations.trim() && photos.length === 0) {
      showToast("Ajoute des observations ou des photos");
      return;
    }
    setLoading(true);
    setResult(null);

    const prompts = {
      description: `Génère une description de visite professionnelle pour ce ${buildingType}${adresse ? ` situé au ${adresse}` : ""}.\n\nObservations :\n${observations}`,
      resume: `Génère un résumé exécutif concis de l'inspection pour ce ${buildingType}${adresse ? ` situé au ${adresse}` : ""}.\n\nObservations :\n${observations}`,
      non_conformites: `Liste toutes les non-conformités détectées avec leur niveau de risque (CRITIQUE / MAJEUR / MINEUR) et les actions correctives recommandées.\n\nType de bâtiment : ${buildingType}${adresse ? `\nAdresse : ${adresse}` : ""}\nObservations :\n${observations}`,
      complet: `Génère un rapport d'inspection électrique complet structuré avec les sections suivantes :\n1. Description de la visite\n2. Résumé exécutif\n3. Non-conformités (avec niveau de risque)\n4. Recommandations\n\nType de bâtiment : ${buildingType}${adresse ? `\nAdresse : ${adresse}` : ""}\nObservations :\n${observations}`,
    };

    // Construire le contenu multimodal
    const content = [];

    // Ajouter les photos en base64
    for (const photo of photos) {
      const base64 = photo.url.split(",")[1];
      const mediaType = photo.url.split(";")[0].split(":")[1] || "image/jpeg";
      content.push({
        type: "image",
        source: { type: "base64", media_type: mediaType, data: base64 }
      });
    }

    content.push({ type: "text", text: prompts[reportType] });

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content }],
        }),
      });

      const data = await response.json();
      const text = data.content?.find(b => b.type === "text")?.text || "Erreur de génération";

      const entry = {
        id: Date.now(),
        type: reportType,
        buildingType,
        adresse,
        contenu: text,
        date: new Date().toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" }),
      };

      setResult(entry);
      setHistory(prev => [entry, ...prev.slice(0, 19)]);
      setTab("resultat");
    } catch (err) {
      showToast("Erreur API : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const copyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.contenu);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const typeLabel = REPORT_TYPES.find(t => t.id === reportType)?.label || "";

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">

        {/* Header */}
        <div className="header">
          <div className="header-icon">⚡</div>
          <div>
            <h1>Inspection Électrique</h1>
            <span>Assistant IA</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: "0 20px", background: "#0F1923" }}>
          <div className="tabs">
            {[
              { id: "saisie", label: "Saisie" },
              { id: "resultat", label: "Résultat" },
              { id: "historique", label: `Historique (${history.length})` },
            ].map(t => (
              <button key={t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main */}
        <div className="main">

          {/* ── TAB SAISIE ── */}
          {tab === "saisie" && (
            <>
              {/* Infos bâtiment */}
              <div className="card">
                <div className="card-label">Bâtiment</div>
                <div className="field-row" style={{ marginBottom: 10 }}>
                  <select className="select-input" value={buildingType} onChange={e => setBuildingType(e.target.value)}>
                    {BUILDING_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <input
                  className="select-input"
                  placeholder="Adresse (optionnel)"
                  value={adresse}
                  onChange={e => setAdresse(e.target.value)}
                />
              </div>

              {/* Observations */}
              <div className="card">
                <div className="card-label">Observations</div>
                <button
                  className={`vocal-btn ${recording ? "recording" : ""}`}
                  onClick={toggleVocal}
                  disabled={transcribing}
                >
                  {transcribing
                    ? "⏳ Transcription en cours…"
                    : recording
                    ? `⏹ Arrêter  •  ${String(Math.floor(recordingSecs/60)).padStart(2,"0")}:${String(recordingSecs%60).padStart(2,"0")}`
                    : "🎤 Dicter les observations"}
                </button>
                <textarea
                  className="text-input"
                  style={{ marginTop: 10 }}
                  placeholder="Ou saisir manuellement…&#10;Ex: Panneau 200A Square D, branchement aérien, disjoncteur principal défectueux…"
                  value={observations}
                  onChange={e => setObservations(e.target.value)}
                  rows={5}
                />
              </div>

              {/* Photos */}
              <div className="card">
                <div className="card-label">Photos</div>
                <div className="photo-zone" onClick={() => fileInputRef.current?.click()}>
                  📷 Appuyer pour ajouter des photos
                  <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handlePhotos} />
                </div>
                {photos.length > 0 && (
                  <div className="photo-thumb">
                    {photos.map((p, i) => (
                      <div key={i} style={{ position: "relative" }}>
                        <img src={p.url} alt={p.name} />
                        <button
                          onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                          style={{
                            position: "absolute", top: -5, right: -5,
                            background: "#E8373B", border: "none", borderRadius: "50%",
                            width: 18, height: 18, fontSize: 10, cursor: "pointer", color: "white",
                            display: "flex", alignItems: "center", justifyContent: "center"
                          }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Type de rapport */}
              <div className="card">
                <div className="card-label">Type de rapport</div>
                <div className="report-types">
                  {REPORT_TYPES.map(t => (
                    <button key={t.id} className={`type-btn ${reportType === t.id ? "active" : ""}`} onClick={() => setReportType(t.id)}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Générer */}
              {loading ? (
                <div className="loading">
                  <span className="dot-spin" style={{ fontSize: 20 }}>⚙</span>
                  Génération en cours…
                </div>
              ) : (
                <button className="generate-btn" onClick={generate} disabled={!observations.trim() && photos.length === 0}>
                  Générer le rapport ⚡
                </button>
              )}
            </>
          )}

          {/* ── TAB RÉSULTAT ── */}
          {tab === "resultat" && (
            <>
              {result ? (
                <div className="result-card">
                  <div className="result-header">
                    <div>
                      <div className="result-type">{REPORT_TYPES.find(t => t.id === result.type)?.label}</div>
                      <div style={{ fontSize: 12, color: "#8A9BB0", marginTop: 3 }}>
                        {result.buildingType}{result.adresse ? ` — ${result.adresse}` : ""} · {result.date}
                      </div>
                    </div>
                    <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={copyResult}>
                      {copied ? "✓ Copié" : "Copier"}
                    </button>
                  </div>
                  <div className="result-body">{result.contenu}</div>
                </div>
              ) : (
                <div style={{ textAlign: "center", color: "#8A9BB0", padding: "60px 20px", fontSize: 14 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                  Aucun rapport généré.<br />
                  <span style={{ fontSize: 12 }}>Va dans l'onglet Saisie pour commencer.</span>
                </div>
              )}
            </>
          )}

          {/* ── TAB HISTORIQUE ── */}
          {tab === "historique" && (
            <>
              {history.length === 0 ? (
                <div style={{ textAlign: "center", color: "#8A9BB0", padding: "60px 20px", fontSize: 14 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🕐</div>
                  Aucun historique pour l'instant.
                </div>
              ) : (
                history.map(h => (
                  <div key={h.id} className="history-item" onClick={() => { setResult(h); setTab("resultat"); }}>
                    <div className="history-meta">
                      <span>{h.buildingType}{h.adresse ? ` — ${h.adresse}` : ""}</span>
                      <span>{h.date}</span>
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <span className="badge">{REPORT_TYPES.find(t => t.id === h.type)?.label}</span>
                    </div>
                    <div className="history-preview">{h.contenu.substring(0, 80)}…</div>
                  </div>
                ))
              )}
            </>
          )}

        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

