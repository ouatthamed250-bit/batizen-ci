/**
 * Templates de documents officiels BÂTIZEN.CI
 * Reçus de paiement et Contrats de construction
 */

type RecuData = {
  numeroRecu: string;
  datePaiement: string;
  modePaiement: string;
  numeroContrat: string;
  clientNom: string;
  clientTelephone: string;
  clientEmail: string;
  clientAdresse: string;
  clientVille: string;
  chantierLieu: string;
  chantierType: string;
  chantierDescription: string;
  depotNumero: string;
  depotDesignation: string;
  depotMontant: number;
  depotObservations: string;
  montantTotal: number;
  montantLettres: string;
  agentNom: string;
  agentFonction: string;
};

type ContratData = {
  numeroContrat: string;
  date: string;
  clientNom: string;
  clientTelephone: string;
  clientEmail: string;
  clientAdresse: string;
  clientVille: string;
  chantierLieu: string;
  chantierType: string;
  surface: string | number;
  descriptionTravaux: string;
  prestations: string[];
  dateDebut: string;
  dateFin: string;
  duree: string;
  montantTotal: number;
  acomptePourcentage: number;
  acompteMontant: number;
  resteAPayer: number;
  echeancier: Array<{
    description: string;
    date: string;
    montant: number;
  }>;
  notesParticulieres: string;
  agentNom: string;
};

/**
 * Template de reçu de paiement BÂTIZEN.CI
 */
export function getRecuTemplate(data: RecuTemplateProps): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Reçu de paiement - BÂTIZEN.CI</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; margin: 0; }
      .header { text-align: center; border-bottom: 3px solid #FF7A00; padding-bottom: 20px; margin-bottom: 30px; }
      .logo { font-size: 28px; font-weight: bold; color: #FF7A00; margin-bottom: 10px; }
      .subtitle { font-size: 16px; color: #666; }
      .title { font-size: 24px; font-weight: bold; color: #111827; margin: 20px 0; }
      .section { margin: 20px 0; }
      .label { font-weight: bold; color: #666; }
      .montant { font-size: 32px; font-weight: bold; color: #22C55E; text-align: center; margin: 30px 0; }
      .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
      .info-item { background: #f9fafb; padding: 10px; border-radius: 8px; }
      .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-left: 10px; }
      .bg-green { background: #dcfce7; color: #166534; }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="logo">BÂTIZEN.CI</div>
      <div class="subtitle">REÇU DE PAIEMENT - DOCUMENT OFFICIEL</div>
    </div>

    <div class="title">REÇU DE PAIEMENT N° ${data.numeroRecu}</div>

    <div class="info-grid">
      <div class="info-item">
        <span class="label">Date :</span> ${data.datePaiement}
      </div>
      <div class="info-item">
        <span class="label">Mode :</span> ${data.modePaiement}
      </div>
      <div class="info-item">
        <span class="label">Contrat :</span> ${data.numeroContrat}
      </div>
    </div>

    <div class="section">
      <h3 style="color: #111827; border-bottom: 2px solid #FF7A00; padding-bottom: 5px;">CLIENT</h3>
      <p><span class="label">Nom :</span> ${data.clientNom}</p>
      <p><span class="label">Téléphone :</span> ${data.clientTelephone}</p>
      <p><span class="label">Email :</span> ${data.clientEmail}</p>
      <p><span class="label">Adresse :</span> ${data.clientAdresse}, ${data.clientVille}</p>
    </div>

    <div class="section">
      <h3 style="color: #111827; border-bottom: 2px solid #FF7A00; padding-bottom: 5px;">CHANTIER</h3>
      <p><span class="label">Lieu :</span> ${data.chantierLieu}</p>
      <p><span class="label">Type :</span> ${data.chantierType}</p>
      <p><span class="label">Description :</span> ${data.chantierDescription}</p>
    </div>

    <div class="section">
      <h3 style="color: #111827; border-bottom: 2px solid #FF7A00; padding-bottom: 5px;">DÉTAIL DU PAIEMENT</h3>
      <p><span class="label">Désignation :</span> ${data.depotDesignation}</p>
      <p><span class="label">Référence :</span> ${data.depotObservations || "N/A"}</p>
      <div class="montant">${data.montantTotal?.toLocaleString('fr-FR') || 0} FCFA</div>
      <p><em>${data.montantLettres}</em></p>
    </div>

    <div class="footer">
      <p>Ce reçu confirme la réception du paiement indiqué ci-dessus.</p>
      <p>BÂTIZEN.CI - Votre partenaire BTP de confiance | +225 07 07 07 07 07</p>
      <p>Émis par : ${data.agentNom} (${data.agentFonction})</p>
    </div>
  </body>
</html>`;
}

/**
 * Template de contrat de construction BÂTIZEN.CI
 */
export function getContratTemplate(data: ContratTemplateProps): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Contrat de construction - BÂTIZEN.CI</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; margin: 0; }
      .header { text-align: center; border-bottom: 3px solid #FF7A00; padding-bottom: 20px; margin-bottom: 30px; }
      .logo { font-size: 28px; font-weight: bold; color: #FF7A00; margin-bottom: 10px; }
      .subtitle { font-size: 16px; color: #666; }
      .title { font-size: 24px; font-weight: bold; color: #111827; margin: 20px 0; text-align: center; }
      .section { margin: 20px 0; page-break-inside: avoid; }
      .label { font-weight: bold; color: #666; }
      .montant { font-size: 28px; font-weight: bold; color: #0B5FFF; }
      .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
      th { background: #FF7A00; color: white; }
      .signature-box { border: 2px dashed #ddd; padding: 40px; text-align: center; margin-top: 40px; }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="logo">BÂTIZEN.CI</div>
      <div class="subtitle">CONTRAT DE CONSTRUCTION - DOCUMENT OFFICIEL</div>
    </div>

    <div class="title">CONTRAT DE CONSTRUCTION N° ${data.numeroContrat}</div>

    <div class="section">
      <p><span class="label">Date :</span> ${data.date}</p>
    </div>

    <div class="section">
      <h3 style="color: #111827; border-bottom: 2px solid #FF7A00; padding-bottom: 5px;">PARTIES AU CONTRAT</h3>
      <p><strong>CLIENT :</strong></p>
      <p>${data.clientNom}<br>
         Tél : ${data.clientTelephone}<br>
         Email : ${data.clientEmail}<br>
         Adresse : ${data.clientAdresse}, ${data.clientVille}</p>
    </div>

    <div class="section">
      <h3 style="color: #111827; border-bottom: 2px solid #FF7A00; padding-bottom: 5px;">OBJET DU CONTRAT</h3>
      <p><span class="label">Type de chantier :</span> ${data.chantierType}</p>
      <p><span class="label">Lieu :</span> ${data.chantierLieu}</p>
      <p><span class="label">Surface :</span> ${data.surface} m²</p>
      <p><span class="label">Description :</span> ${data.descriptionTravaux}</p>
    </div>

    <div class="section">
      <h3 style="color: #111827; border-bottom: 2px solid #FF7A00; padding-bottom: 5px;">PRESTATIONS</h3>
      <ul>
        ${(data.prestations || []).map((p: string) => `<li>${p}</li>`).join('')}
      </ul>
    </div>

    <div class="section">
      <h3 style="color: #111827; border-bottom: 2px solid #FF7A00; padding-bottom: 5px;">DURÉE DES TRAVAUX</h3>
      <p><span class="label">Date de début :</span> ${data.dateDebut || "À définir"}</p>
      <p><span class="label">Date de fin prévue :</span> ${data.dateFin || "À définir"}</p>
      <p><span class="label">Durée estimée :</span> ${data.duree}</p>
    </div>

    <div class="section">
      <h3 style="color: #111827; border-bottom: 2px solid #FF7A00; padding-bottom: 5px;">RÉPARTITION PAIEMENT</h3>
      <table>
        <thead>
          <tr>
            <th>DÉSIGNATION</th>
            <th>DATE</th>
            <th>MONTANT (FCFA)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Acompte (${data.acomptePourcentage}%)</td>
            <td>${data.echeancier?.[0]?.date || data.date}</td>
            <td>${data.acompteMontant?.toLocaleString('fr-FR') || 0}</td>
          </tr>
          ${(data.echeancier || []).slice(1).map((e: any) => `
          <tr>
            <td>${e.description}</td>
            <td>${e.date || "À définir"}</td>
            <td>${e.montant?.toLocaleString('fr-FR') || 0}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <p class="montant">TOTAL : ${data.montantTotal?.toLocaleString('fr-FR') || 0} FCFA</p>
    </div>

    ${data.notesParticulieres ? `
    <div class="section">
      <h3 style="color: #111827; border-bottom: 2px solid #FF7A00; padding-bottom: 5px;">NOTES PARTICULIÈRES</h3>
      <p>${data.notesParticulieres}</p>
    </div>` : ''}

    <div class="signature-box">
      <p><strong>SIGNATURES DES PARTIES</strong></p>
      <p>Le client .................................................</p>
      <p>Signature : _____________________ Date : ________</p>
      <br><br>
      <p>BÂTIZEN.CI représenté par ${data.agentNom}</p>
      <p>Signature : _____________________ Date : ________</p>
    </div>

    <div class="footer">
      <p>BÂTIZEN.CI - Votre partenaire BTP de confiance</p>
      <p>+225 07 07 07 07 07 | contact@batizen.ci</p>
      <p>Document généré le ${new Date().toLocaleDateString('fr-FR')}</p>
    </div>
  </body>
</html>`;
}

type RecuTemplateProps = {
  numeroRecu: string;
  datePaiement: string;
  modePaiement: string;
  numeroContrat: string;
  clientNom: string;
  clientTelephone: string;
  clientEmail: string;
  clientAdresse: string;
  clientVille: string;
  chantierLieu: string;
  chantierType: string;
  chantierDescription: string;
  depotNumero: string;
  depotDesignation: string;
  depotMontant: number;
  depotObservations: string;
  montantTotal: number;
  montantLettres: string;
  agentNom: string;
  agentFonction: string;
};

type ContratTemplateProps = {
  numeroContrat: string;
  date: string;
  clientNom: string;
  clientTelephone: string;
  clientEmail: string;
  clientAdresse: string;
  clientVille: string;
  chantierLieu: string;
  chantierType: string;
  surface: string | number;
  descriptionTravaux: string;
  prestations: string[];
  dateDebut: string;
  dateFin: string;
  duree: string;
  montantTotal: number;
  acomptePourcentage: number;
  acompteMontant: number;
  resteAPayer: number;
  echeancier: Array<{
    description: string;
    date: string;
    montant: number;
  }>;
  notesParticulieres: string;
  agentNom: string;
};