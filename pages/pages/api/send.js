import Resend from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if(req.method !== 'POST') return res.status(405).send('Method Not Allowed')

  try {
    const { sitesCount, form } = req.body

    let html = `<h2>Nuovo form Coho Rooms</h2>
                <p><strong>Sites:</strong> ${sitesCount}</p>
                <p><strong>Email:</strong> ${form.email}</p>
                <p><strong>Nome:</strong> ${form.firstname} ${form.lastname}</p>
                <p><strong>B&B:</strong> ${form.bnbName}</p>
                <p><strong>Indirizzo:</strong> ${form.addressStreetType} ${form.addressStreetName} ${form.addressNumber}</p>`

    if(form.avatar){
      html += `<p><strong>Avatar:</strong></p><img src="${form.avatar.dataUrl}" style="max-width:200px" />`
    }

    await resend.emails.send({
      from: 'no-reply@coho_service.com',
      to: form.email,
      subject: 'Conferma form Coho Rooms',
      html
    })

    res.status(200).send('Email inviata')
  } catch(e){
    console.error(e)
    res.status(500).send('Errore server')
  }
}
