import { useState } from "react";

/*
  Coho Rooms - Multi-step form (client)
  - Usa FormData per inviare payload JSON + file reali
  - Mantiene i file in memoria (File objects) in filesMap
  - Limite singolo file: 2 MB (puoi cambiarlo)
*/

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

function validateEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

function FileInput({ name, onChange, accept = "image/*" }) {
  return <input type="file" name={name} accept={accept} onChange={onChange} />;
}

export default function CohoRoomsForm() {
  const [step, setStep] = useState(0); // 0: preview, 1..10 pages, 11 riepilogo
  const [sitesCount, setSitesCount] = useState(1);

  // campi base (Pagina 1)
  const [base, setBase] = useState({
    email: "",
    nome: "",
    cognome: "",
    bnbName: "",
    indirizzo: { tipo: "", nome: "", numero: "" }
  });

  // rooms: array di oggetti per ogni sito/room
  const emptyRoom = () => ({
    checkinText: "",
    checkinImageKeys: [], // keys in filesMap
    roomName: "",
    roomDesc: "",
    roomImageKeys: [], // multiple
    wifiSame: true // default: keep same wifi
  });
  const [rooms, setRooms] = useState([emptyRoom()]); // length = sitesCount (sync below)

  // sezione regole, servizi, wifi, checkout, cityGuide, piatti, tour
  const [houseRules, setHouseRules] = useState({ text: "", imageKey: null });
  const [services, setServices] = useState([]); // each {title, address}
  const [wifi, setWifi] = useState({ ssid: "", password: "" });
  const [checkout, setCheckout] = useState({ text: "", lateText: "", imageKey: null });
  const [cityGuide, setCityGuide] = useState({ intro: "", places: [] }); // places: {title, desc}
  const [dishes, setDishes] = useState([]); // {name, note}
  const [tours, setTours] = useState([]); // {title, desc, contact, imageKey}

  // filesMap: key -> File object (non-serializable)
  const [filesMap, setFilesMap] = useState({});

  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  // keep rooms array length in sync with sitesCount
  function syncRooms(count) {
    setRooms(prev => {
      const copy = [...prev];
      while (copy.length < count) copy.push(emptyRoom());
      while (copy.length > count) copy.pop();
      return copy;
    });
  }

  // handle change helpers
  function onBaseChange(field, value) {
    setBase(b => ({ ...b, [field]: value }));
  }
  function onAddressChange(key, value) {
    setBase(b => ({ ...b, indirizzo: { ...b.indirizzo, [key]: value } }));
  }

  function onRoomChange(index, field, value) {
    setRooms(rs => {
      const copy = [...rs];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function addService() {
    setServices(s => [...s, { title: "", address: "" }]);
  }
  function addPlace() {
    setCityGuide(c => ({ ...c, places: [...c.places, { title: "", desc: "" }] }));
  }
  function addDish() {
    setDishes(d => [...d, { name: "", note: "" }]);
  }
  function addTour() {
    setTours(t => [...t, { title: "", desc: "", contact: "", imageKey: null }]);
  }

  // file handling: create a stable key and store File object
  function handleFileChange(e, key) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      alert("File troppo grande. Massimo 2 MB per file.");
      e.target.value = "";
      return;
    }
    setFilesMap(m => ({ ...m, [key]: f }));
  }

  // helper to generate file key string
  function fk(prefix) {
    // prefix should be descriptive, e.g. `room0_avatar` or `bb_logo`
    return `${prefix}`;
  }

  // build payload object and send
  async function onSubmitFinal(e) {
    e && e.preventDefault();
    // basic validations
    if (!validateEmail(base.email)) {
      alert("Inserisci una email valida nella Pagina 1.");
      setStep(1);
      return;
    }

    setSending(true);
    setStatus("Preparazione invio...");

    // costruisci payload (testuale)
    const payload = {
      sitesCount,
      base,
      rooms: rooms.map(r => ({
        checkinText: r.checkinText,
        roomName: r.roomName,
        roomDesc: r.roomDesc,
        wifiSame: r.wifiSame,
        // file keys are referenced; actual File objects sono in filesMap
        checkinImageKeys: r.checkinImageKeys || [],
        roomImageKeys: r.roomImageKeys || []
      })),
      houseRules,
      services,
      wifi,
      checkout,
      cityGuide,
      dishes,
      tours
    };

    // build FormData
    const fd = new FormData();
    fd.append("payload", JSON.stringify(payload));

    // append files from filesMap
    for (const key of Object.keys(filesMap)) {
      try {
        fd.append(`file_${key}`, filesMap[key], filesMap[key].name);
      } catch (err) {
        console.error("Errore append file", key, err);
      }
    }

    // send
    setStatus("Invio in corso...");
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        body: fd
      });
      if (!res.ok) {
        const txt = await res.text();
        setStatus("Errore invio: " + txt);
        setSending(false);
        return;
      }
      setStatus("Invio completato. Controlla la tua casella email.");
      setSending(false);
      // opzionale: reset form
    } catch (err) {
      console.error(err);
      setStatus("Errore di rete durante l'invio.");
      setSending(false);
    }
  }

  // UI per ogni step: semplificata ma completa
  function StepPreview() {
    return (
      <div>
        <h2>Quanti siti vuoi creare? ({sitesCount})</h2>
        <input
          type="range"
          min={1}
          max={10}
          value={sitesCount}
          onChange={(e) => {
            const v = Number(e.target.value);
            setSitesCount(v);
            syncRooms(v);
          }}
        />
        <div>Selezionati: {sitesCount}</div>
        <button onClick={() => setStep(1)}>Avanti — Pagina 1</button>
      </div>
    );
  }

  function StepPage1() {
    return (
      <div>
        <h2>Pagina 1 — Informazioni di base</h2>
        <label>Email (obbligatoria)</label>
        <input
          type="email"
          value={base.email}
          onChange={(e) => onBaseChange("email", e.target.value)}
          style={{ width: "100%" }}
        />
        <label>Nome</label>
        <input value={base.nome} onChange={(e) => onBaseChange("nome", e.target.value)} />
        <label>Cognome</label>
        <input value={base.cognome} onChange={(e) => onBaseChange("cognome", e.target.value)} />
        <label>Nome B&B (opzionale)</label>
        <input value={base.bnbName} onChange={(e) => onBaseChange("bnbName", e.target.value)} />
        <div>
          <label>Tipo (Via/Viale/Contrada)</label>
          <input value={base.indirizzo.tipo} onChange={(e) => onAddressChange("tipo", e.target.value)} />
          <label>Nome via</label>
          <input value={base.indirizzo.nome} onChange={(e) => onAddressChange("nome", e.target.value)} />
          <label>Numero civico</label>
          <input value={base.indirizzo.numero} onChange={(e) => onAddressChange("numero", e.target.value)} />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Avatar host o logo (opzionale)</label>
          <FileInput
            name="bb_logo"
            onChange={(e) => {
              const key = fk("bb_logo");
              handleFileChange(e, key);
            }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <button onClick={() => setStep(0)}>Indietro</button>{" "}
          <button onClick={() => setStep(2)}>Avanti — Check-in (Pagina 2)</button>
        </div>
      </div>
    );
  }

  function StepPage2_Checkin(roomIdx) {
    const r = rooms[roomIdx];
    return (
      <div>
        <h3>Pagina 2 — Check-in (stanza {roomIdx + 1})</h3>
        <label>Istruzioni check-in (testo)</label>
        <textarea value={r.checkinText} onChange={(e) => onRoomChange(roomIdx, "checkinText", e.target.value)} />

        <label>Early check-in / Deposito bagagli (esempio)</label>
        <small>Facci sapere se vuoi lasciare i bagagli prima dell'ora di check-in.</small>

        <div>
          <label>Allega foto check-in (opzionale)</label>
          <FileInput
            name={`room${roomIdx}_checkin`}
            onChange={(e) => {
              const key = fk(`room${roomIdx}_checkin`);
              // store key in room.checkinImageKeys
              onRoomChange(roomIdx, "checkinImageKeys", [key]);
              handleFileChange(e, key);
            }}
          />
        </div>
      </div>
    );
  }

  function StepPage3_RoomInstructions(roomIdx) {
    const r = rooms[roomIdx];
    return (
      <div>
        <h3>Pagina 3 — Istruzioni stanza (stanza {roomIdx + 1})</h3>
        <label>Nome stanza (opzionale)</label>
        <input value={r.roomName} onChange={(e) => onRoomChange(roomIdx, "roomName", e.target.value)} />
        <label>Descrizione stanza</label>
        <textarea value={r.roomDesc} onChange={(e) => onRoomChange(roomIdx, "roomDesc", e.target.value)} />
        <div>
          <label>Allega foto stanza</label>
          <FileInput
            name={`room${roomIdx}_photo0`}
            onChange={(e) => {
              const key = fk(`room${roomIdx}_photo0`);
              onRoomChange(roomIdx, "roomImageKeys", [...(rooms[roomIdx].roomImageKeys || []), key]);
              handleFileChange(e, key);
            }}
          />
        </div>
      </div>
    );
  }

  function StepPage4_HouseRules() {
    return (
      <div>
        <h2>Pagina 4 — Regole della casa</h2>
        <label>Descrizione regole</label>
        <textarea value={houseRules.text} onChange={(e) => setHouseRules(hr => ({ ...hr, text: e.target.value }))} />
        <label>Allega immagine regole (opzionale)</label>
        <FileInput
          name="house_rules_img"
          onChange={(e) => {
            const key = fk("house_rules_img");
            setHouseRules(hr => ({ ...hr, imageKey: key }));
            handleFileChange(e, key);
          }}
        />
      </div>
    );
  }

  function StepPage5_Services() {
    return (
      <div>
        <h2>Pagina 5 — Servizi e dintorni (opzionale)</h2>
        <button onClick={addService}>Aggiungi servizio</button>
        {services.map((s, i) => (
          <div key={i}>
            <label>Nome (es. Panificio 'Il buon pane')</label>
            <input value={s.title} onChange={(e) => {
              const copy = [...services]; copy[i].title = e.target.value; setServices(copy);
            }} />
            <label>Via / Indirizzo</label>
            <input value={s.address} onChange={(e) => {
              const copy = [...services]; copy[i].address = e.target.value; setServices(copy);
            }} />
          </div>
        ))}
      </div>
    );
  }

  function StepPage6_Wifi() {
    return (
      <div>
        <h2>Pagina 6 — WiFi</h2>
        <label>SSID</label>
        <input value={wifi.ssid} onChange={(e) => setWifi(w => ({ ...w, ssid: e.target.value }))} />
        <label>Password</label>
        <input value={wifi.password} onChange={(e) => setWifi(w => ({ ...w, password: e.target.value }))} />
        <div>
          <small>Generatore QR: se vuoi, puoi copiare il contenuto in un generatore esterno (es. https://api.qrserver.com)</small>
        </div>
      </div>
    );
  }

  function StepPage7_Checkout() {
    return (
      <div>
        <h2>Pagina 7 — Check-out</h2>
        <label>Istruzioni check-out</label>
        <textarea value={checkout.text} onChange={(e) => setCheckout(c => ({ ...c, text: e.target.value }))} />
        <label>Late check-out (opzionale)</label>
        <input value={checkout.lateText} onChange={(e) => setCheckout(c => ({ ...c, lateText: e.target.value }))} />
        <label>Allega immagine (opzionale)</label>
        <FileInput
          name="checkout_img"
          onChange={(e) => {
            const key = fk("checkout_img");
            setCheckout(c => ({ ...c, imageKey: key }));
            handleFileChange(e, key);
          }}
        />
      </div>
    );
  }

  function StepPage8_CityGuide() {
    return (
      <div>
        <h2>Pagina 8 — Guida alla città</h2>
        <label>Introduzione (opzionale)</label>
        <textarea value={cityGuide.intro} onChange={(e) => setCityGuide(c => ({ ...c, intro: e.target.value }))} />
        <button onClick={addPlace}>Aggiungi luogo (max 15)</button>
        {cityGuide.places.map((p, i) => (
          <div key={i}>
            <label>Luogo</label>
            <input value={p.title} onChange={(e) => {
              const copy = { ...cityGuide }; copy.places[i].title = e.target.value; setCityGuide(copy);
            }} />
            <label>Descrizione</label>
            <input value={p.desc} onChange={(e) => {
              const copy = { ...cityGuide }; copy.places[i].desc = e.target.value; setCityGuide(copy);
            }} />
          </div>
        ))}
      </div>
    );
  }

  function StepPage9_Dishes() {
    return (
      <div>
        <h2>Pagina 9 — Piatti da non perdere</h2>
        <button onClick={addDish}>Aggiungi piatto</button>
        {dishes.map((d, i) => (
          <div key={i}>
            <label>Piatto</label>
            <input value={d.name} onChange={(e) => { const copy = [...dishes]; copy[i].name = e.target.value; setDishes(copy); }} />
            <label>Spiegazione / Consiglio</label>
            <input value={d.note} onChange={(e) => { const copy = [...dishes]; copy[i].note = e.target.value; setDishes(copy); }} />
          </div>
        ))}
      </div>
    );
  }

  function StepPage10_Tours() {
    return (
      <div>
        <h2>Pagina 10 — Tour consigliati</h2>
        <button onClick={addTour}>Aggiungi tour</button>
        {tours.map((t, i) => (
          <div key={i}>
            <label>Titolo tour</label>
            <input value={t.title} onChange={(e) => { const copy = [...tours]; copy[i].title = e.target.value; setTours(copy); }} />
            <label>Descrizione</label>
            <textarea value={t.desc} onChange={(e) => { const copy = [...tours]; copy[i].desc = e.target.value; setTours(copy); }} />
            <label>Contatto / Link</label>
            <input value={t.contact} onChange={(e) => { const copy = [...tours]; copy[i].contact = e.target.value; setTours(copy); }} />
            <label>Immagine tour (opzionale)</label>
            <FileInput name={`tour${i}_img`} onChange={(e) => {
              const key = fk(`tour${i}_img`);
              const copy = [...tours]; copy[i].imageKey = key; setTours(copy);
              handleFileChange(e, key);
            }} />
          </div>
        ))}
      </div>
    );
  }

  function StepSummary() {
    return (
      <div>
        <h2>Pagina 11 — Riepilogo</h2>
        <div><strong>Sites:</strong> {sitesCount}</div>
        <div><strong>Email:</strong> {base.email}</div>
        <div><strong>Nome:</strong> {base.nome} {base.cognome}</div>
        <div><strong>Indirizzo:</strong> {base.indirizzo.tipo} {base.indirizzo.nome} {base.indirizzo.numero}</div>

        <h3>Camere / Siti</h3>
        {rooms.map((r, i) => (
          <div key={i} style={{ border: "1px solid #ddd", padding: 8, marginBottom: 6 }}>
            <div><strong>Stanza {i+1}</strong></div>
            <div>Nome: {r.roomName}</div>
            <div>Check-in: {r.checkinText ? r.checkinText.slice(0,120) : "-"}</div>
            <div>Descrizione: {r.roomDesc ? r.roomDesc.slice(0,120) : "-"}</div>
            <div>Immagini: { (r.roomImageKeys || []).length + (r.checkinImageKeys || []).length } file</div>
          </div>
        ))}

        <div style={{ marginTop: 12 }}>
          <button onClick={() => setStep(10)}>Modifica</button>{" "}
          <button disabled={sending} onClick={onSubmitFinal}>{sending ? "Invio..." : "Conferma e invia"}</button>
        </div>
      </div>
    );
  }

  // render step
  return (
    <div style={{ maxWidth: 900, margin: "20px auto", padding: 16, fontFamily: "Arial, sans-serif" }}>
      <h1>Coho Rooms — Form</h1>
      <div style={{ marginBottom: 12 }}>{status}</div>

      {step === 0 && <StepPreview />}
      {step === 1 && <StepPage1 />}
      {step >= 2 && step <= (2 + (sitesCount * 2) - 1) && (
        // we map site-specific pages: for each site, page2 (checkin) and page3 (room)
        (() => {
          // compute index from step
          const relative = step - 2; // 0..(sitesCount*2 -1)
          const roomIdx = Math.floor(relative / 2);
          const pageType = relative % 2 === 0 ? 2 : 3; // 2=checkin, 3=room
          return (
            <div>
              <button onClick={() => setStep(1)}>Indietro a Pagina 1</button>
              <div style={{ marginTop: 8 }}>
                {pageType === 2 ? StepPage2_Checkin(roomIdx) : StepPage3_RoomInstructions(roomIdx)}
              </div>
              <div style={{ marginTop: 8 }}>
                <button onClick={() => setStep(Math.max(1, step - 1))}>Indietro</button>{" "}
                <button onClick={() => {
                  // next: if last room and room page, go to Pagina 4, else next step
                  const maxStep = 2 + sitesCount * 2; // first step after rooms block
                  if (step + 1 >= maxStep) setStep(4);
                  else setStep(step + 1);
                }}>Avanti</button>
              </div>
            </div>
          );
        })()
      )}

      {step === 4 && <StepPage4_HouseRules />}
      {step === 5 && <StepPage5_Services />}
      {step === 6 && <StepPage6_Wifi />}
      {step === 7 && <StepPage7_Checkout />}
      {step === 8 && <StepPage8_CityGuide />}
      {step === 9 && <StepPage9_Dishes />}
      {step === 10 && <StepPage10_Tours />}
      {step === 11 && <StepSummary />}

      {/* navigation footer */}
      <div style={{ marginTop: 18 }}>
        {step < 11 && step !== 0 && <button onClick={() => setStep(step + 1)}>Avanti</button>}
        {step < 11 && step !== 0 && <button onClick={() => setStep(step - 1)} style={{ marginLeft: 8 }}>Indietro</button>}
        {step === 0 && <button onClick={() => setStep(1)} style={{ marginLeft: 8 }}>Inizia</button>}
      </div>

      <hr style={{ marginTop: 18 }} />
      <div style={{ fontSize: 12, color: "#666" }}>
        <strong>Note:</strong> ogni immagine viene caricata in memoria e inviata via email. Evitare file > 2 MB.
      </div>
    </div>
  );
}
