import { useState } from 'react'
import ImagePreview from '../components/ImagePreview'

export default function Home() {
  const [step, setStep] = useState(0) // 0: preview, 1: pagina1, 2: riepilogo
  const [sitesCount, setSitesCount] = useState(1)

  const [form, setForm] = useState({
    email: '',
    firstname: '',
    lastname: '',
    bnbName: '',
    addressStreetType: '',
    addressStreetName: '',
    addressNumber: '',
    avatar: null // { name, dataUrl }
  })

  function setField(k, v){ setForm(f => ({...f, [k]: v})) }

  function handleFile(e){
    const file = e.target.files[0]
    if(!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setField('avatar', { name: file.name, dataUrl: reader.result })
    }
    reader.readAsDataURL(file)
  }

  function validateEmail(email){
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
  }

  async function submitAll(){
    const payload = { sitesCount, form }
    const res = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if(res.ok) {
      alert('Invio riuscito')
      setStep(0)
    } else {
      const text = await res.text()
      alert('Errore invio: ' + text)
    }
  }

  return (
    <div style={{fontFamily: 'Arial, sans-serif', maxWidth:800, margin:'40px auto'}}>
      <h1>Coho Rooms — Form starter</h1>

      {step === 0 && (
        <div>
          <h2>Preview — Quanti siti vuoi creare?</h2>
          <input type="range" min={1} max={10} value={sitesCount}
            onChange={e => setSitesCount(Number(e.target.value))} />
          <div>Selezionati: {sitesCount}</div>
          <button onClick={() => setStep(1)}>Avanti — Pagina 1</button>
        </div>
      )}

      {step === 1 && (
        <div>
          <h2>Pagina 1 — Informazioni di base</h2>
          <label>Email (obbligatoria)</label><br/>
          <input value={form.email} onChange={e => setField('email', e.target.value)} placeholder="host@email.com" style={{width:'100%'}} />
          {!validateEmail(form.email) && form.email.length>0 && <div style={{color:'crimson'}}>Email non valida</div>}

          <label>Nome</label>
          <input value={form.firstname} onChange={e => setField('firstname', e.target.value)} style={{width:'48%', marginRight:'4%'}} />
          <input value={form.lastname} onChange={e => setField('lastname', e.target.value)} style={{width:'48%'}} />

          <label>Nome B&B (opzionale)</label>
          <input value={form.bnbName} onChange={e => setField('bnbName', e.target.value)} style={{width:'100%'}} />

          <label>Indirizzo — Tipo di strada (es: Via, Viale, Contrada)</label>
          <input value={form.addressStreetType} onChange={e => setField('addressStreetType', e.target.value)} style={{width:'32%', marginRight:'2%'}} />
          <input value={form.addressStreetName} onChange={e => setField('addressStreetName', e.target.value)} style={{width:'52%', marginRight:'2%'}} />
          <input value={form.addressNumber} onChange={e => setField('addressNumber', e.target.value)} style={{width:'12%'}} />

          <div style={{marginTop:12}}>
            <label>Avatar o logo (opzionale)</label>
            <input type="file" accept="image/*" onChange={handleFile} />
            {form.avatar && <ImagePreview file={form.avatar} />}
          </div>

          <div style={{marginTop:20, display:'flex', gap:12}}>
            <button onClick={() => setStep(0)}>Indietro</button>
            <button onClick={() => setStep(2)}>Riepilogo</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>Riepilogo</h2>
          <div><strong>Sites:</strong> {sitesCount}</div>
          <div><strong>Email:</strong> {form.email}</div>
          <div><strong>Nome:</strong> {form.firstname} {form.lastname}</div>
          <div><strong>B&B:</strong> {form.bnbName}</div>
          <div><strong>Indirizzo:</strong> {form.addressStreetType} {form.addressStreetName} {form.addressNumber}</div>
          {form.avatar && (
            <div>
              <strong>Avatar:</strong>
              <ImagePreview file={form.avatar} />
            </div>
          )}

          <div style={{marginTop:20}}>
            <button onClick={() => setStep(1)}>Modifica</button>
            <button onClick={submitAll}>Conferma e invia</button>
          </div>
        </div>
      )}

    </div>
  )
}
