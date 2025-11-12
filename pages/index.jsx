import { useState } from "react";

export default function Home() {
  const [formData, setFormData] = useState({
    email: "",
    nome: "",
    cognome: "",
    bnbName: "",
    via: "",
    indirizzo: "",
    civico: "",
    avatar: null,
  });

  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Invio in corso...");

    const data = new FormData();
    for (const key in formData) {
      data.append(key, formData[key]);
    }

    const res = await fetch("/api/send", {
      method: "POST",
      body: data,
    });

    if (res.ok) {
      setStatus("Email inviata con successo!");
    } else {
      setStatus("Errore durante l'invio.");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem" }}>
      <h1>Coho Rooms - Pagina 1: Informazioni di base</h1>
      <form onSubmit={handleSubmit}>
        <label>Email (obbligatorio):</label>
        <input type="email" name="email" required onChange={handleChange} />

        <label>Nome:</label>
        <input type="text" name="nome" onChange={handleChange} />

        <label>Cognome:</label>
        <input type="text" name="cognome" onChange={handleChange} />

        <label>Nome B&B (opzionale):</label>
        <input type="text" name="bnbName" onChange={handleChange} />

        <label>Via/Viale/Piazza ecc.:</label>
        <input type="text" name="via" onChange={handleChange} />

        <label>Nome della via:</label>
        <input type="text" name="indirizzo" onChange={handleChange} />

        <label>Numero civico:</label>
        <input type="text" name="civico" onChange={handleChange} />

        <label>Avatar host o logo (opzionale):</label>
        <input type="file" name="avatar" accept="image/*" onChange={handleChange} />

        <button type="submit">Invia</button>
      </form>

      <p>{status}</p>
    </div>
  );
}
