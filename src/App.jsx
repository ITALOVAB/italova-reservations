import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://vhbkdmevybfrejbtnmjr.supabase.co";
const SUPABASE_KEY = "sb_publishable_2LUPsXszV4IBN_FlkZRZtg_IHbtxd9L";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ESPACES = ["Salle", "Véranda", "Patio"];
const JOURS = ["Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const CRENEAUX_MIDI = ["12:00","12:15","12:30","12:45","13:00","13:15","13:30"];
const CRENEAUX_SOIR = ["19:30","19:45","20:00","20:15","20:30","20:45","21:00","21:15","21:30"];

// Vérifie si un service est encore disponible aujourd'hui (cutoff 30min avant)
function serviceDisponibleAujourdhui(service) {
  const now = new Date();
  const cutoff = new Date();
  if (service === "midi") {
    cutoff.setHours(11, 45, 0); // cutoff midi
  } else {
    cutoff.setHours(19, 15, 0); // cutoff soir
  }
  return now < cutoff;
}

// Génère les dates disponibles J+1 à J+15, mardi au samedi
// J+0 (aujourd'hui) inclus seulement si un service est encore dispo
function getDatesDisponibles() {
  const dates = [];
  const today = new Date();
  
  // Vérifier si aujourd'hui est un jour ouvert et a encore des services dispos
  const jourAujourdhui = today.getDay();
  if (jourAujourdhui >= 2 && jourAujourdhui <= 6) {
    if (serviceDisponibleAujourdhui("midi") || serviceDisponibleAujourdhui("soir")) {
      dates.push(new Date(today));
    }
  }

  for (let i = 1; i <= 45; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const jour = d.getDay();
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

const STEPS = ["date", "service", "couverts", "infos", "confirmation"];

export default function App() {
  const [step, setStep] = useState("date");
  const [form, setForm] = useState({
    date: null,
    service: null,
    heure: null,
    espace: "Salle",
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
    const tel = form.telephone.replace(/\s/g, "").replace(/\./g, "").replace(/-/g, "");
    if (!/^0[1-9][0-9]{8}$/.test(tel)) {
      setError("Veuillez saisir un numéro de téléphone valide (ex: 06 12 34 56 78).");
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
    setForm({ date:null, service:null, heure:null, espace:"Salle", couverts:null, enfants:0, animaux:false, commentaire:"", nom:"", prenom:"", telephone:"" });
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
          à <strong style={{color:"#fff"}}>{form.heure}</strong> — {form.couverts} couvert{form.couverts>1?"s":""}
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
          {["Date", "Service", "Couverts", "Infos"].map((s, i) => {
            const stepKeys = ["date","service","couverts","infos"];
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
          <div style={{ fontSize:18, fontWeight:800, marginBottom:4 }}>Choisissez une date</div>
          <div style={{ fontSize:13, color:"#7a6555", marginBottom:16 }}>Disponible du mardi au samedi, jusqu'à 45 jours à l'avance</div>

          {/* Date exceptionnelle — Fête des Mères */}
          {(() => {
            const feteMeres = new Date(2026, 4, 31); // Dimanche 31 mai 2026
            const today = new Date();
            const isAvailable = feteMeres > today;
            if (!isAvailable) return null;
            const selected = form.date && formatDateISO(form.date)===formatDateISO(feteMeres);
            return (
              <button onClick={()=>{ update("date", feteMeres); fetchOccupied(feteMeres); setStep("service"); }} style={{
                width:"100%", background: selected?"linear-gradient(135deg,#d4195a,#FF2D78)":"linear-gradient(135deg,#fff0f5,#ffe4ef)",
                border:`2px solid ${selected?"#FF2D78":"#ffb3cc"}`, borderRadius:14, padding:"14px 16px",
                cursor:"pointer", fontFamily:"inherit", marginBottom:20, textAlign:"left",
                boxShadow: selected?"0 4px 16px rgba(255,45,120,0.4)":"0 2px 8px rgba(255,45,120,0.1)",
                transition:"all 0.15s"
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:28 }}>🌸</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:800, color:selected?"#fff":"#FF2D78", letterSpacing:"0.5px" }}>Ouverture exceptionnelle</div>
                    <div style={{ fontSize:15, fontWeight:800, color:selected?"#fff":"#1a0f08", marginTop:2 }}>Dimanche 31 mai — Fête des Mères</div>
                    <div style={{ fontSize:11, color:selected?"rgba(255,255,255,0.8)":"#9a8575", marginTop:3 }}>Service du midi uniquement</div>
                  </div>
                  {selected && <span style={{ marginLeft:"auto", fontSize:20 }}>✓</span>}
                </div>
              </button>
            );
          })()}

          {/* Grouper par semaine */}
          {(() => {
            const weeks = {};
            dates.forEach(d => {
              const monday = new Date(d);
              monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
              const key = monday.toISOString().split("T")[0];
              if (!weeks[key]) weeks[key] = [];
              weeks[key].push(d);
            });

            const JOURS_COURTS = ["","Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
            const MOIS = ["jan","fév","mar","avr","mai","jun","jul","aoû","sep","oct","nov","déc"];

            return Object.entries(weeks).map(([weekKey, weekDates]) => (
              <div key={weekKey} style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, fontWeight:700, color:"#9a8575", textTransform:"uppercase", letterSpacing:"2px", marginBottom:8 }}>
                  Semaine du {new Date(weekKey).getDate()} {MOIS[new Date(weekKey).getMonth()]}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:6 }}>
                  {weekDates.map((d, i) => {
                    const selected = form.date && formatDateISO(form.date)===formatDateISO(d);
                    return (
                      <button key={i} onClick={() => { update("date", d); fetchOccupied(d); setStep("service"); }} style={{
                        background: selected ? "linear-gradient(135deg,#d4195a,#FF2D78)" : "#fff",
                        border: `1px solid ${selected ? "#FF2D78" : "#e0d4c4"}`,
                        borderRadius:10, padding:"10px 4px", cursor:"pointer", textAlign:"center",
                        color: selected ? "#fff" : "#1a0f08",
                        fontFamily:"inherit", transition:"all 0.15s",
                        boxShadow: selected ? "0 4px 12px rgba(255,45,120,0.3)" : "none"
                      }}>
                        <div style={{ fontSize:10, fontWeight:600, opacity:selected?0.85:1, color:selected?"#fff":"#9a8575", marginBottom:4 }}>
                          {JOURS_COURTS[d.getDay()]}
                        </div>
                        <div style={{ fontSize:18, fontWeight:800, lineHeight:1 }}>
                          {d.getDate()}
                        </div>
                        <div style={{ fontSize:10, marginTop:3, opacity:selected?0.85:1, color:selected?"#fff":"#9a8575" }}>
                          {MOIS[d.getMonth()]}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </>}

        {/* ── ÉTAPE 2 : SERVICE + HEURE ── */}
        {step==="service" && <>
          <div style={{ fontSize:18, fontWeight:800, marginBottom:2 }}>Choisissez le service</div>
          <div style={{ fontSize:13, color:"#7a6555", marginBottom:16 }}>{formatDate(form.date)}</div>

          {/* Midi */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#7a6555", marginBottom:8, textTransform:"uppercase", letterSpacing:"1px" }}>🌞 Midi — 12h à 13h45</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
              {CRENEAUX_MIDI.filter(h => {
              if ((occupiedSlots[h] || 0) >= 5) return false;
              // Pas de contrainte de créneau pour la fête des mères
              if (form.date && formatDateISO(form.date) === "2026-05-31") return true;
              // Bloquer tout le service midi à partir de 11h45
              if (form.date && formatDateISO(form.date) === formatDateISO(new Date())) {
                const now = new Date();
                const cutoff = new Date(); cutoff.setHours(11, 45, 0);
                if (now >= cutoff) return false;
              }
              return true;
            }).map(h => (
                <button key={h} onClick={() => { update("heure", h); update("service", "midi"); setStep("couverts"); }} style={{
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
          {!(form.date && formatDateISO(form.date) === "2026-05-31") && <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#7a6555", marginBottom:8, textTransform:"uppercase", letterSpacing:"1px" }}>🌙 Soir — 19h30 à 21h45</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
              {CRENEAUX_SOIR.filter(h => {
              if ((occupiedSlots[h] || 0) >= 5) return false;
              // Bloquer tout le service soir à partir de 19h15
              if (form.date && formatDateISO(form.date) === formatDateISO(new Date())) {
                const now = new Date();
                const cutoff = new Date(); cutoff.setHours(19, 15, 0);
                if (now >= cutoff) return false;
              }
              return true;
            }).map(h => (
                <button key={h} onClick={() => { update("heure", h); update("service", "soir"); setStep("couverts"); }} style={{
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
              <strong style={{color:"#FF2D78"}}>Appelez-nous au 04 91 75 18 06</strong>
            </div>
          )}
          <button onClick={() => setStep("date")} style={{ marginTop:20, background:"none", border:"none", color:"#FF2D78", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>← Retour</button>
        </>}

        {/* ── ÉTAPE 3 : ESPACE ── */}

        {/* ── ÉTAPE 4 : COUVERTS ── */}
        {step==="couverts" && <>
          <div style={{ fontSize:18, fontWeight:800, marginBottom:2 }}>Combien de personnes ?</div>
          <div style={{ fontSize:13, color:"#7a6555", marginBottom:16 }}>{formatDate(form.date)} · {form.heure}</div>

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
            <div style={{ fontSize:12, fontWeight:700, color:"#1a0f08", marginBottom:4 }}>👶 Dont enfants de moins de 12 ans</div>
            <div style={{ fontSize:11, color:"#9a8575", marginBottom:8 }}>Chaise haute disponible sur demande</div>
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
                <div style={{ fontSize:13, fontWeight:700 }}>🐾 J'amène mon animal de compagnie</div>
                <div style={{ fontSize:11, opacity:0.8, marginTop:2 }}>Acceptés · merci de vous assurer qu'il reste calme et sous la table</div>
              </div>
              <span style={{ marginLeft:"auto", fontSize:16 }}>{form.animaux ? "✓" : ""}</span>
            </button>
          </div>

          {/* Commentaire */}
          <div style={{ marginBottom:20 }}>
            <textarea placeholder="Allergie, régime spécifique, fauteuil roulant, poussette, siège bébé, placement souhaité..." value={form.commentaire}
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

          <button onClick={() => setStep("service")} style={{ marginTop:12, width:"100%", background:"none", border:"none", color:"#FF2D78", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>← Retour</button>
        </>}

        {/* ── ÉTAPE 5 : INFOS CLIENT ── */}
        {step==="infos" && <>
          <div style={{ fontSize:18, fontWeight:800, marginBottom:2 }}>Vos coordonnées</div>
          <div style={{ fontSize:13, color:"#7a6555", marginBottom:16 }}>
            {formatDate(form.date)} · {form.heure} · {form.couverts} couvert{form.couverts>1?"s":""}
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
