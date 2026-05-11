import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://vhbkdmevybfrejbtnmjr.supabase.co";
const SUPABASE_KEY = "sb_publishable_2LUPsXszV4IBN_FlkZRZtg_IHbtxd9L";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ESPACES = ["Salle", "Véranda", "Patio"];
const JOURS = ["Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const CRENEAUX_MIDI = ["12:00","12:15","12:30","12:45","13:00","13:15","13:30","13:45"];
const CRENEAUX_SOIR = ["19:30","19:45","20:00","20:15","20:30","20:45","21:00","21:15","21:30","21:45"];

// Génère les dates disponibles J+1 à J+15, mardi au samedi
function getDatesDisponibles() {
  const dates = [];
  const today = new Date();
  for (let i = 1; i <= 15; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const jour = d.getDay(); // 0=dim, 1=lun, 2=mar, 3=mer, 4=jeu, 5=ven, 6=sam
    if (jour >= 2 && jour <= 6) dates.push(d);
  }
  return dates;
}

function formatDate(d) {
  return d.toLocaleDateString("fr-FR", { weekday:"long", day:"2-digit", month:"long" });
}

function formatDateISO(d) {
  return d.toISOString().split("T")[0];
}

const STEPS = ["date", "service", "espace", "couverts", "infos", "confirmation"];

export default function App() {
  const [step, setStep] = useState("date");
  const [form, setForm] = useState({
    date: null,
    service: null,
    heure: null,
    espace: null,
    couverts: null,
    enfants: 0,
    animaux: false,
    commentaire: "",
    nom: "",
    prenom: "",
    telephone: "",
  });
  const [loading, setLoading] = useState(false);
  const [occupiedSlots, setOccupiedSlots] = useState({});
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const fetchOccupied = async (date) => {
    if (!date) return;
    const { data } = await supabase
      .from("reservations")
      .select("heure")
      .eq("date", formatDateISO(date));
    if (data) {
      const counts = {};
      data.forEach(r => { counts[r.heure] = (counts[r.heure] || 0) + 1; });
      setOccupiedSlots(counts);
    }
  };

  const dates = getDatesDisponibles();

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const submit = async () => {
    if (!form.nom || !form.prenom || !form.telephone) {
      setError("Merci de remplir tous les champs.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.from("reservations").insert({
      date: formatDateISO(form.date),
      service: form.service,
      heure: form.heure,
      espace: form.espace,
      couverts: form.couverts,
      enfants: form.enfants,
      animaux: form.animaux,
      enfants_nb: form.enfants,
      commentaire: form.commentaire.trim(),
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      telephone: form.telephone.trim(),
      statut: "confirmée",
    });
    setLoading(false);
    if (err) { setError("Une erreur est survenue, veuillez réessayer."); return; }
    setSuccess(true);
  };

  const reset = () => {
    setForm({ date:null, service:null, heure:null, espace:null, couverts:null, enfants:0, animaux:false, commentaire:"", nom:"", prenom:"", telephone:"" });
    setStep("date");
    setSuccess(false);
    setError(null);
  };

  // Success screen
  if (success) return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#1a0515,#2d0a20)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <div style={{ width:"100%", maxWidth:420, textAlign:"center" }}>
        <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
        <div style={{ fontSize:24, fontWeight:800, color:"#FF2D78", marginBottom:8, letterSpacing:"2px" }}>Réservation confirmée !</div>
        <div style={{ fontSize:14, color:"rgba(255,255,255,0.7)", marginBottom:24, lineHeight:1.6 }}>
          Merci <strong style={{color:"#fff"}}>{form.prenom} {form.nom}</strong> !<br/>
          Nous vous attendons le <strong style={{color:"#fff"}}>{formatDate(form.date)}</strong><br/>
          à <strong style={{color:"#fff"}}>{form.heure}</strong> — {form.espace} — {form.couverts} couvert{form.couverts>1?"s":""}
        </div>
        <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:12, padding:"14px 18px", marginBottom:24, fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.6 }}>
          📍 3 Boulevard Gilibert, 13009 Marseille<br/>
          📞 Pour toute modification, appelez-nous
        </div>
        <button onClick={reset} style={{ background:"linear-gradient(135deg,#d4195a,#FF2D78)", border:"none", color:"#fff", borderRadius:10, padding:"12px 28px", fontSize:14, fontWeight:700, cursor:"pointer" }}>
          Nouvelle réservation
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#FFF8F0", fontFamily:"'DM Sans','Segoe UI',sans-serif", color:"#1a0f08" }}>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#1a0515,#2d0a20)", padding:"16px 20px", textAlign:"center" }}>
        <div style={{ fontSize:28, marginBottom:4 }}>🍕</div>
        <div style={{ fontSize:22, fontWeight:800, color:"#FF2D78", letterSpacing:"4px" }}>ITALOVA</div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", letterSpacing:"2px", textTransform:"uppercase", marginTop:2 }}>Réserver une table</div>
      </div>

      {/* Progress bar */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e0d4c4", padding:"12px 20px" }}>
        <div style={{ display:"flex", gap:4, maxWidth:480, margin:"0 auto" }}>
          {["Date", "Service", "Espace", "Couverts", "Infos"].map((s, i) => {
            const stepKeys = ["date","service","espace","couverts","infos"];
            const current = STEPS.indexOf(step);
            const done = current > i;
            const active = current === i;
            return (
              <div key={s} style={{ flex:1, textAlign:"center" }}>
                <div style={{ height:3, borderRadius:2, background: done||active?"#FF2D78":"#e0d4c4", marginBottom:4, transition:"all 0.3s" }}/>
                <div style={{ fontSize:9, color: done||active?"#FF2D78":"#9a8575", fontWeight:600, letterSpacing:"0.5px" }}>{s}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding:"20px 16px", maxWidth:480, margin:"0 auto" }}>

        {/* ── ÉTAPE 1 : DATE ── */}
        {step==="date" && <>
          <div style={{ fontSize:18, fontWeight:800, marginBottom:6 }}>Choisissez une date</div>
          <div style={{ fontSize:13, color:"#7a6555", marginBottom:16 }}>Disponible du mardi au samedi, jusqu'à 15 jours à l'avance</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {dates.map((d, i) => (
              <button key={i} onClick={() => { update("date", d); fetchOccupied(d); setStep("service"); }} style={{
                background: form.date && formatDateISO(form.date)===formatDateISO(d) ? "linear-gradient(135deg,#d4195a,#FF2D78)" : "#fff",
                border: `1px solid ${form.date && formatDateISO(form.date)===formatDateISO(d) ? "#FF2D78" : "#e0d4c4"}`,
                borderRadius:10, padding:"14px 16px", cursor:"pointer", textAlign:"left",
                color: form.date && formatDateISO(form.date)===formatDateISO(d) ? "#fff" : "#1a0f08",
                fontSize:14, fontWeight:600, fontFamily:"inherit", transition:"all 0.15s"
              }}>
                {formatDate(d)}
              </button>
            ))}
          </div>
        </>}

        {/* ── ÉTAPE 2 : SERVICE + HEURE ── */}
        {step==="service" && <>
          <div style={{ fontSize:18, fontWeight:800, marginBottom:2 }}>Choisissez le service</div>
          <div style={{ fontSize:13, color:"#7a6555", marginBottom:16 }}>{formatDate(form.date)}</div>

          {/* Midi */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#7a6555", marginBottom:8, textTransform:"uppercase", letterSpacing:"1px" }}>🌞 Midi — 12h à 13h45</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
              {CRENEAUX_MIDI.filter(h => (occupiedSlots[h] || 0) < 5).map(h => (
                <button key={h} onClick={() => { update("heure", h); update("service", "midi"); setStep("espace"); }} style={{
                  background: form.heure===h ? "linear-gradient(135deg,#d4195a,#FF2D78)" : "#fff",
                  border:`1px solid ${form.heure===h?"#FF2D78":"#e0d4c4"}`,
                  borderRadius:8, padding:"10px 0", cursor:"pointer",
                  color: form.heure===h?"#fff":"#1a0f08",
                  fontSize:13, fontWeight:600, fontFamily:"inherit"
                }}>{h}</button>
              ))}
            </div>
          </div>

          {/* Soir */}
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#7a6555", marginBottom:8, textTransform:"uppercase", letterSpacing:"1px" }}>🌙 Soir — 19h30 à 21h45</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
              {CRENEAUX_SOIR.filter(h => (occupiedSlots[h] || 0) < 5).map(h => (
                <button key={h} onClick={() => { update("heure", h); update("service", "soir"); setStep("espace"); }} style={{
                  background: form.heure===h ? "linear-gradient(135deg,#d4195a,#FF2D78)" : "#fff",
                  border:`1px solid ${form.heure===h?"#FF2D78":"#e0d4c4"}`,
                  borderRadius:8, padding:"10px 0", cursor:"pointer",
                  color: form.heure===h?"#fff":"#1a0f08",
                  fontSize:13, fontWeight:600, fontFamily:"inherit"
                }}>{h}</button>
              ))}
            </div>
          </div>

          {CRENEAUX_MIDI.filter(h => (occupiedSlots[h] || 0) < 5).length === 0 && CRENEAUX_SOIR.filter(h => (occupiedSlots[h] || 0) < 5).length === 0 && (
            <div style={{ background:"rgba(255,45,120,0.06)", border:"1px solid rgba(255,45,120,0.2)", borderRadius:10, padding:"14px", textAlign:"center", fontSize:13, color:"#7a6555", marginBottom:16 }}>
              😔 Tous les créneaux sont complets pour cette date.<br/>
              <strong style={{color:"#FF2D78"}}>Appelez-nous pour vérifier les disponibilités.</strong>
            </div>
          )}
          <button onClick={() => setStep("date")} style={{ marginTop:20, background:"none", border:"none", color:"#FF2D78", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>← Retour</button>
        </>}

        {/* ── ÉTAPE 3 : ESPACE ── */}
        {step==="espace" && <>
          <div style={{ fontSize:18, fontWeight:800, marginBottom:2 }}>Choisissez votre espace</div>
          <div style={{ fontSize:13, color:"#7a6555", marginBottom:16 }}>{formatDate(form.date)} à {form.heure}</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {[
              { name:"Salle", icon:"🏠", desc:"Espace principal, climatisé" },
              { name:"Véranda", icon:"🌿", desc:"Lumière naturelle, vue sur l'extérieur" },
              { name:"Patio", icon:"☀️", desc:"En plein air, ambiance conviviale" },
            ].map(e => (
              <button key={e.name} onClick={() => { update("espace", e.name); setStep("couverts"); }} style={{
                background: form.espace===e.name ? "linear-gradient(135deg,#d4195a,#FF2D78)" : "#fff",
                border:`1px solid ${form.espace===e.name?"#FF2D78":"#e0d4c4"}`,
                borderRadius:12, padding:"16px", cursor:"pointer", textAlign:"left",
                color: form.espace===e.name?"#fff":"#1a0f08",
                fontFamily:"inherit", transition:"all 0.15s"
              }}>
                <div style={{ fontSize:22, marginBottom:4 }}>{e.icon}</div>
                <div style={{ fontSize:15, fontWeight:700 }}>{e.name}</div>
                <div style={{ fontSize:12, opacity:0.8, marginTop:2 }}>{e.desc}</div>
              </button>
            ))}
          </div>
          <button onClick={() => setStep("service")} style={{ marginTop:16, background:"none", border:"none", color:"#FF2D78", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>← Retour</button>
        </>}

        {/* ── ÉTAPE 4 : COUVERTS ── */}
        {step==="couverts" && <>
          <div style={{ fontSize:18, fontWeight:800, marginBottom:2 }}>Combien de personnes ?</div>
          <div style={{ fontSize:13, color:"#7a6555", marginBottom:16 }}>{formatDate(form.date)} · {form.heure} · {form.espace}</div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, marginBottom:16 }}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button key={n} onClick={() => update("couverts", n)} style={{
                background: form.couverts===n ? "linear-gradient(135deg,#d4195a,#FF2D78)" : "#fff",
                border:`1px solid ${form.couverts===n?"#FF2D78":"#e0d4c4"}`,
                borderRadius:10, padding:"14px 0", cursor:"pointer",
                color: form.couverts===n?"#fff":"#1a0f08",
                fontSize:16, fontWeight:700, fontFamily:"inherit"
              }}>{n}</button>
            ))}
          </div>

          <div style={{ background:"rgba(255,45,120,0.06)", border:"1px solid rgba(255,45,120,0.2)", borderRadius:10, padding:"12px 14px", marginBottom:16, fontSize:13, color:"#7a6555" }}>
            👥 Pour plus de 10 personnes, appelez-nous au <strong style={{color:"#FF2D78"}}>04 91 75 18 06</strong>
          </div>

          {/* Enfants */}
          <div style={{ background:"#fff", border:"1px solid #e0d4c4", borderRadius:10, padding:"12px 14px", marginBottom:10 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#1a0f08", marginBottom:8 }}>👶 Enfants de moins de 12 ans</div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <button onClick={() => update("enfants", Math.max(0, form.enfants - 1))} style={{ width:34, height:34, borderRadius:8, background:"#f5ede0", border:"1px solid #e0d4c4", color:"#1a0f08", fontSize:18, cursor:"pointer", fontFamily:"inherit", lineHeight:1 }}>−</button>
              <div style={{ flex:1, textAlign:"center" }}>
                <span style={{ fontSize:22, fontWeight:800, color: form.enfants > 0 ? "#FF2D78" : "#9a8575" }}>{form.enfants}</span>
                <span style={{ fontSize:12, color:"#9a8575", marginLeft:6 }}>enfant{form.enfants > 1 ? "s" : ""}</span>
              </div>
              <button onClick={() => update("enfants", form.enfants + 1)} style={{ width:34, height:34, borderRadius:8, background:"#f5ede0", border:"1px solid #e0d4c4", color:"#1a0f08", fontSize:18, cursor:"pointer", fontFamily:"inherit", lineHeight:1 }}>+</button>
            </div>
          </div>

          {/* Animaux */}
          <div style={{ marginBottom:10 }}>
            <button onClick={() => update("animaux", !form.animaux)} style={{
              width:"100%", background: form.animaux ? "linear-gradient(135deg,#d4195a,#FF2D78)" : "#fff",
              border:`1px solid ${form.animaux?"#FF2D78":"#e0d4c4"}`,
              borderRadius:10, padding:"12px", cursor:"pointer",
              color: form.animaux?"#fff":"#1a0f08",
              fontFamily:"inherit", textAlign:"left", display:"flex", alignItems:"center", gap:10
            }}>
              <span style={{ fontSize:22 }}>🐾</span>
              <div>
                <div style={{ fontSize:13, fontWeight:700 }}>Animal de compagnie</div>
                <div style={{ fontSize:11, opacity:0.8 }}>Acceptés en terrasse</div>
              </div>
              <span style={{ marginLeft:"auto", fontSize:16 }}>{form.animaux ? "✓" : ""}</span>
            </button>
          </div>

          {/* Commentaire */}
          <div style={{ marginBottom:20 }}>
            <textarea placeholder="Précisions : ombre souhaité, poussette, fauteuil roulant, allergie..." value={form.commentaire}
              onChange={e => update("commentaire", e.target.value)} rows={3}
              style={{ width:"100%", background:"#fff", border:"1px solid #e0d4c4", borderRadius:10, padding:"10px 13px", color:"#1a0f08", fontSize:13, outline:"none", resize:"none", boxSizing:"border-box", fontFamily:"inherit" }}/>
          </div>

          <button onClick={() => setStep("infos")} disabled={!form.couverts} style={{
            width:"100%", background: form.couverts?"linear-gradient(135deg,#d4195a,#FF2D78)":"#e0d4c4",
            border:"none", color: form.couverts?"#fff":"#9a8575",
            borderRadius:10, padding:"13px", fontSize:14, fontWeight:700,
            cursor: form.couverts?"pointer":"not-allowed", fontFamily:"inherit",
            boxShadow: form.couverts?"0 4px 14px rgba(255,45,120,0.4)":"none"
          }}>Continuer →</button>

          <button onClick={() => setStep("espace")} style={{ marginTop:12, width:"100%", background:"none", border:"none", color:"#FF2D78", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>← Retour</button>
        </>}

        {/* ── ÉTAPE 5 : INFOS CLIENT ── */}
        {step==="infos" && <>
          <div style={{ fontSize:18, fontWeight:800, marginBottom:2 }}>Vos coordonnées</div>
          <div style={{ fontSize:13, color:"#7a6555", marginBottom:16 }}>
            {formatDate(form.date)} · {form.heure} · {form.espace} · {form.couverts} couvert{form.couverts>1?"s":""}
            {form.enfants > 0 ? ` · 👶 ${form.enfants} enfant${form.enfants > 1 ? "s" : ""}` : ""}{form.animaux ? " · 🐾" : ""}
          </div>

          {[
            { label:"Prénom", key:"prenom", placeholder:"Votre prénom", type:"text" },
            { label:"Nom", key:"nom", placeholder:"Votre nom", type:"text" },
            { label:"Téléphone", key:"telephone", placeholder:"06 XX XX XX XX", type:"tel" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, color:"#7a6555", display:"block", marginBottom:4, fontWeight:600, textTransform:"uppercase", letterSpacing:"1px" }}>{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} value={form[f.key]}
                onChange={e => update(f.key, e.target.value)}
                style={{ width:"100%", background:"#fff", border:"1px solid #e0d4c4", borderRadius:8, padding:"11px 13px", color:"#1a0f08", fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}/>
            </div>
          ))}

          <div style={{ background:"rgba(255,45,120,0.06)", border:"1px solid rgba(255,45,120,0.15)", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:11, color:"#7a6555", lineHeight:1.6 }}>
            🔒 Vos données sont utilisées uniquement pour votre réservation et nos communications Italova. Elles ne sont jamais partagées avec des tiers.
          </div>

          {error && <div style={{ color:"#FF2D78", fontSize:13, marginBottom:12, fontWeight:600 }}>{error}</div>}

          <button onClick={submit} disabled={loading} style={{
            width:"100%", background:"linear-gradient(135deg,#d4195a,#FF2D78)", border:"none", color:"#fff",
            borderRadius:10, padding:"13px", fontSize:14, fontWeight:700,
            cursor: loading?"wait":"pointer", fontFamily:"inherit",
            boxShadow:"0 4px 14px rgba(255,45,120,0.4)", opacity: loading?0.7:1
          }}>
            {loading ? "Confirmation en cours..." : "✓ Confirmer ma réservation"}
          </button>

          <button onClick={() => setStep("couverts")} style={{ marginTop:12, width:"100%", background:"none", border:"none", color:"#FF2D78", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>← Retour</button>
        </>}

      </div>

      {/* Footer */}
      <div style={{ textAlign:"center", padding:"20px 16px 40px", fontSize:12, color:"#9a8575" }}>
        📍 3 Boulevard Gilibert, 13009 Marseille<br/>
        Mardi au Samedi · Midi 12h–14h · Soir 19h30–23h
      </div>

      <style>{`
        * { -webkit-font-smoothing:antialiased; box-sizing:border-box; }
        button:active { opacity:0.8; }
        input::placeholder { color:#b0a090; }
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
      `}</style>
    </div>
  );
}
