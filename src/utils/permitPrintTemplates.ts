import type { Permit } from '../types';

export const generateBusinessPermitHTML = (permit: any, applicantName: string): string => {
  const businessData = permit.businessPermitData;
  const establishment = businessData?.establishment || {};

  const tradeName =
    establishment.business_name ||
    establishment.trade_name ||
    businessData?.business_name ||
    permit.permit_type?.title ||
    'N/A';

  const ownerName =
    businessData?.owner_name ||
    businessData?.owner ||
    applicantName ||
    'N/A';

  const authorizedRepresentative =
    businessData?.authorized_representative ||
    businessData?.authorizedRepresentative ||
    ownerName;

  const businessAddress =
    establishment.business_address ||
    businessData?.business_address ||
    permit.address ||
    permit.applicant?.fulladdress ||
    'N/A';

  const natureOfBusiness =
    establishment.line_of_business ||
    establishment.nature_of_business ||
    businessData?.line_of_business ||
    businessData?.nature_of_business ||
    'N/A';

  const issuedDateSource = permit.approved_at || permit.updated_at || permit.created_at;
  const issuedDate = issuedDateSource ? new Date(issuedDateSource) : new Date();
  const issuedOn = issuedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const validUntilSource = businessData?.valid_until
    ? new Date(businessData.valid_until)
    : new Date(issuedDate);
  if (!businessData?.valid_until) {
    validUntilSource.setFullYear(validUntilSource.getFullYear() + 1);
  }
  const validUntil = validUntilSource.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const permitNo =
    businessData?.permit_no ||
    businessData?.permit_number ||
    permit.reference_code ||
    permit.tracking_number ||
    (typeof permit.id === 'string' ? permit.id.substring(0, 8) : 'N/A');

  const qrCodeSource =
    businessData?.qr_code_url ||
    businessData?.qrCodeUrl ||
    permit.qr_code_url ||
    `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(permitNo)}`;

  const cityLogoUrl =
    businessData?.city_logo_url ||
    businessData?.seal_url ||
    '/images/valencia-logo.png';

  const watermarkUrl =
    businessData?.watermark_url ||
    businessData?.watermarkUrl ||
    cityLogoUrl;

  const completedPayment = (permit.payments || []).find(
    (payment: any) => payment.payment_status === 'completed'
  );

  const officialReceipt =
    businessData?.or_number ||
    completedPayment?.payment_reference ||
    '__________';

  const amountPaid =
    businessData?.amount_paid ||
    (completedPayment?.amount
      ? `PHP ${Number(completedPayment.amount).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : '__________');

  const paymentDate =
    businessData?.or_date ||
    (completedPayment?.created_at
      ? new Date(completedPayment.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '__________');

  return `
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Business Permit</title>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;600;700;800&family=Roboto:wght@300;400;700&display=swap" rel="stylesheet">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html,body { height: 100%; background:#e9e9e9; font-family: "Roboto", Arial, sans-serif; -webkit-print-color-adjust: exact; }
        .page { width: 794px; margin: 18px auto; background: #fff; padding: 28px; border: 1px solid #cfcfcf; position: relative; overflow: hidden; }
        .page::after { content: ""; position: absolute; inset: 0; pointer-events: none; box-shadow: 0 0 0 2px rgba(0,0,0,0.02) inset; }
        .header { position: relative; display:flex; align-items:center; gap:18px; padding-bottom: 8px; margin-bottom: 8px; }
        .logo-wrap { width: 132px; height: 132px; position: relative; flex: 0 0 132px; }
        .logo { width: 100%; height: 100%; border-radius: 50%; background: #fff; display:flex; align-items:center; justify-content:center; overflow:hidden; border: 6px solid #f0f0f0; box-shadow: 0 0 0 6px rgba(0,0,0,0.00) inset; }
        .logo img { width: 86%; height: 86%; object-fit: contain; display:block; }
        .logo-wrap::before { content: ""; position: absolute; width: 232px; height: 232px; border-radius: 50%; left: -68px; top: -68px; border: 26px solid transparent; border-top-color: #9c1a1a; border-left-color: #9c1a1a; }
        .logo-wrap::after { content: ""; position: absolute; width: 190px; height: 190px; border-radius: 50%; left: -40px; top: -40px; border: 16px solid transparent; border-bottom-color: #0f7f4f; border-right-color: #0f7f4f; }
        .header-text { line-height: 1; z-index: 2; }
        .small-meta { font-size: 11px; color: #666; letter-spacing: .6px; margin-bottom: 6px; }
        .title { font-family: "Montserrat", "Arial", sans-serif; font-weight: 800; font-size: 40px; letter-spacing: 2px; margin-top: 4px; margin-bottom: 4px; }
        .sub-title { font-size: 12px; font-weight:700; color: #333; margin-top: -6px; }
        .green-band { height: 14px; background: #0f7f4f; margin-top: 6px; margin-bottom: 18px; border-radius: 2px; }
        .content-wrap { position: relative; display: grid; grid-template-columns: 1fr 260px; gap: 22px; align-items: start; }
        .watermark { pointer-events: none; position: absolute; inset: 140px 0 0 0; display:flex; justify-content:center; z-index: 0; opacity: 0.12; }
        .watermark img { width: 520px; height: auto; object-fit: contain; }
        .left { z-index: 2; padding-right: 6px; }
        .intro { font-size: 13px; color: #333; margin-bottom: 12px; }
        .holder-name { font-weight: 800; font-size: 18px; color: #111; margin-bottom: 8px; letter-spacing: .6px; text-transform: uppercase; }
        .label { font-weight:700; font-size:12px; color:#333; margin-top:8px; margin-bottom:4px; letter-spacing: .4px; }
        .value { font-size:13px; color:#444; margin-bottom:6px; }
        .issued { margin-top: 14px; font-size: 13px; color: #333; line-height: 1.35; }
        .issued p { margin-bottom: 6px; }
        .right { z-index: 2; position: relative; }
        .qr-card { width: 100%; background: #fff; border: 1px solid #cfcfcf; padding: 12px; text-align: center; box-shadow: 0 1px 0 rgba(0,0,0,0.02); }
        .qr-card img { width: 140px; height:140px; object-fit:cover; display:block; margin: 0 auto 8px; }
        .qr-label { font-size:12px; font-weight:700; color:#333; letter-spacing: .6px; }
        .permit-small { margin-top: 18px; background: #fff; border: 1px solid #e3e3e3; padding: 10px; font-size: 12px; color: #333; line-height: 1.45; }
        .permit-small ul { margin-left: 18px; margin-top: 4px; }
        .permit-small li { margin-bottom: 6px; }
        .reminders { margin-top: 16px; border-top: 3px solid #9c1a1a; padding-top: 10px; font-size: 12px; color: #222; }
        .reminders h4 { color: #9c1a1a; font-weight: 700; font-size: 14px; margin-bottom: 6px; }
        .reminders ul { margin-left: 16px; margin-top:8px; }
        .reminders li { margin-bottom:6px; }
        .sig { margin-top: 32px; display:flex; justify-content: space-between; align-items: flex-end; z-index: 2; gap: 20px; }
        .sig-left { width: 58%; font-size: 12px; color:#555; }
        .sig-right { text-align:right; width: 42%; }
        .mayor-name { font-weight: 800; font-size: 15px; color:#111; }
        .byline { font-size: 11px; color:#666; margin-top:4px; }
        .print-btn { margin-top: 18px; display: inline-block; padding: 10px 18px; background: #198754; color: #fff; border-radius: 6px; border: 0; cursor: pointer; font-weight:700; font-size: 14px; }
        @media print { .print-btn { display:none; } body { background: #fff; } .page { border: none; margin: 0; width: auto; } }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div class="logo-wrap" aria-hidden="true">
            <div class="logo">
              <img src="${cityLogoUrl}" alt="City Logo">
            </div>
          </div>
          <div class="header-text">
            <div class="small-meta">REPUBLIC OF THE PHILIPPINES &nbsp;&nbsp;|&nbsp;&nbsp; PROVINCE OF BUKIDNON</div>
            <div class="title">BUSINESS PERMIT</div>
            <br>
            <div class="sub-title">OFFICE OF THE CITY MAYOR</div>
          </div>
        </div>
        <div class="green-band"></div>
        <div class="content-wrap">
          <div class="watermark">
            <img src="${watermarkUrl}" alt="watermark">
          </div>
          <div class="left">
            <br>
            <p class="intro">Pursuant to the provisions of the City's Revenue Code and other related ordinances, this PERMIT is hereby GRANTED to:</p>
            <div class="holder-name">${tradeName}</div>
            <div>
              <div class="label">TRADE NAME</div>
              <div class="value">${tradeName}</div>
              <div class="label">OWNER</div>
              <div class="value">${ownerName}</div>
              <div class="label">AUTHORIZED REPRESENTATIVE</div>
              <div class="value">${authorizedRepresentative || 'N/A'}</div>
              <div class="label">BUSINESS ADDRESS</div>
              <div class="value">${businessAddress}</div>
              <div class="label">LINE / NATURE OF BUSINESS</div>
              <div class="value">${natureOfBusiness}</div>
            </div>
            <div class="issued">
              <p><strong>ISSUED ON:</strong> ${issuedOn}</p>
              <p><strong>AT:</strong> CITY OF VALENCIA, BUKIDNON</p>
              <p><strong>VALID UNTIL:</strong> ${validUntil}</p>
              <p style="margin-top:10px; font-size:12px; color:#444;">This is subject to extension if tax dues applicable for the year are paid on quarterly/semi-annual/annual basis.</p>
              <p style="margin-top:8px;">
                <strong>O.R. NO.:</strong> ${officialReceipt} &nbsp;&nbsp;
                <strong>AMOUNT:</strong> ${amountPaid} &nbsp;&nbsp;
                <strong>DATE:</strong> ${paymentDate}
              </p>
            </div>
          </div>
          <div class="right">
            <div class="qr-card">
              <img src="${qrCodeSource}" alt="QR Code">
              <div class="qr-label">PERMIT NO. ${permitNo}</div>
              <div style="font-size:11px;color:#666;margin-top:6px;">Present this permit for verification</div>
            </div>
            <div class="permit-small">
              <div style="font-weight:700;margin-bottom:6px;">This Permit is TEMPORARY / CONDITIONAL</div>
              <div style="font-size:12px;margin-bottom:6px;">Requires the following to be marked as complied:</div>
              <ul style="font-size:12px;">
                <li>CERTIFICATE OF OCCUPANCY</li>
                <li>SANITARY PERMIT</li>
                <li>ENVIRONMENTAL CERTIFICATE</li>
                <li>NATIONAL GOVERNMENT AGENCY CLEARANCES</li>
              </ul>
              <div style="margin-top:8px;font-size:11px;color:#666;">Present this permit to the BPLO for markings after clearances are completed.</div>
            </div>
            <div class="reminders">
              <h4>IMPORTANT REMINDERS</h4>
              <p style="font-size:12px;color:#333;">The permit is subject to conditions; non-compliance may result in penalties.</p>
            </div>
          </div>
        </div>
        <div class="sig">
          <div class="sig-left">
            <div style="font-size:11px;color:#555;">ISSUED ON: ${issuedOn} — AT CITY OF VALENCIA, BUKIDNON</div>
          </div>
          <div class="sig-right">
            <div class="mayor-name">AMIE G. GALARIO</div>
            <div class="byline">CITY MAYOR<br>BY AUTHORITY OF THE CITY MAYOR</div>
          </div>
        </div>
        <div style="text-align:center;">
          <button class="print-btn" onclick="window.print()">Print Business Permit</button>
        </div>
      </div>
      <script>window.onload = () => { window.print(); };</script>
    </body>
    </html>
  `;
};

export const generateBuildingPermitHTML = (permit: any, applicantName: string): string => {
  // Try to get data from normalized tables first
  const buildingData = permit.buildingPermitData;
  
  // Handle construction data - it might be an object or array from the join
  let construction = {};
  if (buildingData?.construction) {
    // If it's an array (shouldn't happen with foreign key, but handle it)
    construction = Array.isArray(buildingData.construction) 
      ? buildingData.construction[0] || {} 
      : buildingData.construction;
  }
  
  // Fallback to old format in details JSONB field
  const oldBuildingPermit = permit.details?.building_permit || {};
  
  // Get application number with fallbacks
  const applicationNo = 
    buildingData?.application_no || 
    oldBuildingPermit.application_no || 
    permit.reference_code || 
    permit.tracking_number || 
    'N/A';
  
  // Get BP number with fallbacks
  const bpNo = 
    buildingData?.bp_no || 
    oldBuildingPermit.bp_no || 
    'N/A';
  
  // Get location with fallbacks
  const location = 
    construction.location || 
    buildingData?.location || 
    oldBuildingPermit.construction_location ||
    permit.address || 
    permit.applicant?.fulladdress || 
    'N/A';
  
  // Get scope of work with fallbacks
  const scopeOfWork = 
    construction.scope_of_work || 
    buildingData?.scope_of_work || 
    oldBuildingPermit.scope_of_work || 
    'N/A';
  
  // Get occupancy use with fallbacks
  const occupancyUse = 
    construction.occupancy_use || 
    buildingData?.occupancy_use || 
    oldBuildingPermit.occupancy_use || 
    'N/A';
  
  // Get lot area with fallbacks and format it
  const lotAreaRaw = 
    construction.lot_area ?? 
    buildingData?.lot_area ?? 
    oldBuildingPermit.lot_area ?? 
    null;
  const lotArea = lotAreaRaw !== null && lotAreaRaw !== undefined && lotAreaRaw !== '' 
    ? (typeof lotAreaRaw === 'number' ? lotAreaRaw : parseFloat(String(lotAreaRaw)))
    : null;
  const lotAreaFormatted = lotArea !== null && !isNaN(lotArea) 
    ? `${lotArea.toLocaleString('en-US')} sq.m.` 
    : 'N/A';
  
  // Get floor area with fallbacks and format it
  const floorAreaRaw = 
    construction.floor_area ?? 
    buildingData?.floor_area ?? 
    oldBuildingPermit.floor_area ?? 
    null;
  const floorArea = floorAreaRaw !== null && floorAreaRaw !== undefined && floorAreaRaw !== '' 
    ? (typeof floorAreaRaw === 'number' ? floorAreaRaw : parseFloat(String(floorAreaRaw)))
    : null;
  const floorAreaFormatted = floorArea !== null && !isNaN(floorArea) 
    ? `${floorArea.toLocaleString('en-US')} sq.m.` 
    : 'N/A';
  
  // Get cost of construction with fallbacks and format it
  const costOfConstructionRaw = 
    construction.cost_of_construction ?? 
    buildingData?.cost_of_construction ?? 
    oldBuildingPermit.cost_of_construction ?? 
    null;
  const costOfConstruction = costOfConstructionRaw !== null && costOfConstructionRaw !== undefined && costOfConstructionRaw !== '' 
    ? (typeof costOfConstructionRaw === 'number' ? costOfConstructionRaw : parseFloat(String(costOfConstructionRaw)))
    : null;
  const costOfConstructionFormatted = costOfConstruction !== null && !isNaN(costOfConstruction)
    ? `PHP ${costOfConstruction.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : 'N/A';

  const issuedDateSource = permit.approved_at || permit.updated_at || permit.created_at;
  const issuedDate = issuedDateSource ? new Date(issuedDateSource) : new Date();
  const issuedOn = issuedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const permitNo = buildingData?.permit_no || buildingData?.permit_number || applicationNo || permit.reference_code || permit.tracking_number || (typeof permit.id === 'string' ? permit.id.substring(0, 8) : 'N/A');

  const qrCodeSource =
    buildingData?.qr_code_url ||
    buildingData?.qrCodeUrl ||
    permit.qr_code_url ||
    `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(permitNo)}`;

  const cityLogoUrl =
    buildingData?.city_logo_url ||
    buildingData?.seal_url ||
    '/images/valencia-logo.png';

  const watermarkUrl =
    buildingData?.watermark_url ||
    buildingData?.watermarkUrl ||
    cityLogoUrl;

  const completedPayment = (permit.payments || []).find(
    (payment: any) => payment.payment_status === 'completed'
  );

  const officialReceipt =
    buildingData?.or_number ||
    completedPayment?.payment_reference ||
    '__________';

  const amountPaid =
    buildingData?.amount_paid ||
    (completedPayment?.amount
      ? `PHP ${Number(completedPayment.amount).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : '__________');

  const paymentDate =
    buildingData?.or_date ||
    (completedPayment?.created_at
      ? new Date(completedPayment.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '__________');
  
  return `
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Building Permit</title>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;600;700;800&family=Roboto:wght@300;400;700&display=swap" rel="stylesheet">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html,body { height: 100%; background:#e9e9e9; font-family: "Roboto", Arial, sans-serif; -webkit-print-color-adjust: exact; }
        .page { width: 794px; margin: 18px auto; background: #fff; padding: 28px; border: 1px solid #cfcfcf; position: relative; overflow: hidden; }
        .page::after { content: ""; position: absolute; inset: 0; pointer-events: none; box-shadow: 0 0 0 2px rgba(0,0,0,0.02) inset; }
        .header { position: relative; display:flex; align-items:center; gap:18px; padding-bottom: 8px; margin-bottom: 8px; }
        .logo-wrap { width: 132px; height: 132px; position: relative; flex: 0 0 132px; }
        .logo { width: 100%; height: 100%; border-radius: 50%; background: #fff; display:flex; align-items:center; justify-content:center; overflow:hidden; border: 6px solid #f0f0f0; box-shadow: 0 0 0 6px rgba(0,0,0,0.00) inset; }
        .logo img { width: 86%; height: 86%; object-fit: contain; display:block; }
        .logo-wrap::before { content: ""; position: absolute; width: 232px; height: 232px; border-radius: 50%; left: -68px; top: -68px; border: 26px solid transparent; border-top-color: #9c1a1a; border-left-color: #9c1a1a; }
        .logo-wrap::after { content: ""; position: absolute; width: 190px; height: 190px; border-radius: 50%; left: -40px; top: -40px; border: 16px solid transparent; border-bottom-color: #0f7f4f; border-right-color: #0f7f4f; }
        .header-text { line-height: 1; z-index: 2; }
        .small-meta { font-size: 11px; color: #666; letter-spacing: .6px; margin-bottom: 6px; }
        .title { font-family: "Montserrat", "Arial", sans-serif; font-weight: 800; font-size: 40px; letter-spacing: 2px; margin-top: 4px; margin-bottom: 4px; }
        .sub-title { font-size: 12px; font-weight:700; color: #333; margin-top: -6px; }
        .green-band { height: 14px; background: #0f7f4f; margin-top: 6px; margin-bottom: 18px; border-radius: 2px; }
        .content-wrap { position: relative; display: grid; grid-template-columns: 1fr 260px; gap: 22px; align-items: start; }
        .watermark { pointer-events: none; position: absolute; inset: 140px 0 0 0; display:flex; justify-content:center; z-index: 0; opacity: 0.12; }
        .watermark img { width: 520px; height: auto; object-fit: contain; }
        .left { z-index: 2; padding-right: 6px; }
        .intro { font-size: 13px; color: #333; margin-bottom: 12px; }
        .holder-name { font-weight: 800; font-size: 18px; color: #111; margin-bottom: 8px; letter-spacing: .6px; text-transform: uppercase; }
        .label { font-weight:700; font-size:12px; color:#333; margin-top:8px; margin-bottom:4px; letter-spacing: .4px; }
        .value { font-size:13px; color:#444; margin-bottom:6px; }
        .issued { margin-top: 14px; font-size: 13px; color: #333; line-height: 1.35; }
        .issued p { margin-bottom: 6px; }
        .details-table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; }
        .details-table td { padding: 6px 8px; font-size: 12px; border: 1px solid #e3e3e3; }
        .details-table td:first-child { font-weight: 700; color: #333; background: #f8f8f8; width: 45%; }
        .details-table td:last-child { color: #444; }
        .right { z-index: 2; position: relative; }
        .qr-card { width: 100%; background: #fff; border: 1px solid #cfcfcf; padding: 12px; text-align: center; box-shadow: 0 1px 0 rgba(0,0,0,0.02); }
        .qr-card img { width: 140px; height:140px; object-fit:cover; display:block; margin: 0 auto 8px; }
        .qr-label { font-size:12px; font-weight:700; color:#333; letter-spacing: .6px; }
        .permit-small { margin-top: 18px; background: #fff; border: 1px solid #e3e3e3; padding: 10px; font-size: 12px; color: #333; line-height: 1.45; }
        .permit-small ul { margin-left: 18px; margin-top: 4px; }
        .permit-small li { margin-bottom: 6px; }
        .reminders { margin-top: 16px; border-top: 3px solid #9c1a1a; padding-top: 10px; font-size: 12px; color: #222; }
        .reminders h4 { color: #9c1a1a; font-weight: 700; font-size: 14px; margin-bottom: 6px; }
        .reminders ul { margin-left: 16px; margin-top:8px; }
        .reminders li { margin-bottom:6px; }
        .sig { margin-top: 32px; display:flex; justify-content: space-between; align-items: flex-end; z-index: 2; gap: 20px; }
        .sig-left { width: 58%; font-size: 12px; color:#555; }
        .sig-right { text-align:right; width: 42%; }
        .mayor-name { font-weight: 800; font-size: 15px; color:#111; }
        .byline { font-size: 11px; color:#666; margin-top:4px; }
        .print-btn { margin-top: 18px; display: inline-block; padding: 10px 18px; background: #198754; color: #fff; border-radius: 6px; border: 0; cursor: pointer; font-weight:700; font-size: 14px; }
        @media print { .print-btn { display:none; } body { background: #fff; } .page { border: none; margin: 0; width: auto; } }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div class="logo-wrap" aria-hidden="true">
            <div class="logo">
              <img src="${cityLogoUrl}" alt="City Logo">
            </div>
          </div>
          <div class="header-text">
            <div class="small-meta">REPUBLIC OF THE PHILIPPINES &nbsp;&nbsp;|&nbsp;&nbsp; PROVINCE OF BUKIDNON</div>
            <div class="title">BUILDING PERMIT</div>
            <br>
            <div class="sub-title">OFFICE OF THE CITY MAYOR</div>
          </div>
        </div>
        <div class="green-band"></div>
        <div class="content-wrap">
          <div class="watermark">
            <img src="${watermarkUrl}" alt="watermark">
          </div>
          <div class="left">
            <br>
            <p class="intro">Pursuant to the provisions of the National Building Code and other related ordinances, this PERMIT is hereby GRANTED to:</p>
            <div class="holder-name">${applicantName}</div>
            <div>
              <div class="label">APPLICATION NO.</div>
              <div class="value">${applicationNo}</div>
              <div class="label">BP NO.</div>
              <div class="value">${bpNo}</div>
              <div class="label">LOCATION</div>
              <div class="value">${location}</div>
              <table class="details-table">
                <tr>
                  <td>Scope of Work</td>
                  <td>${scopeOfWork}</td>
                </tr>
                <tr>
                  <td>Occupancy Use</td>
                  <td>${occupancyUse}</td>
                </tr>
                <tr>
                  <td>Lot Area</td>
                  <td>${lotAreaFormatted}</td>
                </tr>
                <tr>
                  <td>Floor Area</td>
                  <td>${floorAreaFormatted}</td>
                </tr>
                <tr>
                  <td>Cost of Construction</td>
                  <td>${costOfConstructionFormatted}</td>
                </tr>
              </table>
            </div>
            <div class="issued">
              <p><strong>ISSUED ON:</strong> ${issuedOn}</p>
              <p><strong>AT:</strong> CITY OF VALENCIA, BUKIDNON</p>
              <p style="margin-top:8px;">
                <strong>O.R. NO.:</strong> ${officialReceipt} &nbsp;&nbsp;
                <strong>AMOUNT:</strong> ${amountPaid} &nbsp;&nbsp;
                <strong>DATE:</strong> ${paymentDate}
              </p>
            </div>
          </div>
          <div class="right">
            <div class="qr-card">
              <img src="${qrCodeSource}" alt="QR Code">
              <div class="qr-label">PERMIT NO. ${permitNo}</div>
              <div style="font-size:11px;color:#666;margin-top:6px;">Present this permit for verification</div>
            </div>
            <div class="permit-small">
              <div style="font-weight:700;margin-bottom:6px;">This Permit is TEMPORARY / CONDITIONAL</div>
              <div style="font-size:12px;margin-bottom:6px;">Requires the following to be marked as complied:</div>
              <ul style="font-size:12px;">
                <li>STRUCTURAL PLANS APPROVED</li>
                <li>ELECTRICAL PERMIT</li>
                <li>PLUMBING PERMIT</li>
                <li>ENVIRONMENTAL CLEARANCE</li>
                <li>FIRE SAFETY CERTIFICATE</li>
              </ul>
              <div style="margin-top:8px;font-size:11px;color:#666;">Present this permit to the Building Official for markings after clearances are completed.</div>
            </div>
            <div class="reminders">
              <h4>IMPORTANT REMINDERS</h4>
              <p style="font-size:12px;color:#333;">The permit is subject to conditions; non-compliance may result in penalties. Construction must comply with approved plans.</p>
            </div>
          </div>
        </div>
        <div class="sig">
          <div class="sig-left">
            <div style="font-size:11px;color:#555;">ISSUED ON: ${issuedOn} — AT CITY OF VALENCIA, BUKIDNON</div>
          </div>
          <div class="sig-right">
            <div class="mayor-name">AMIE G. GALARIO</div>
            <div class="byline">CITY MAYOR<br>BY AUTHORITY OF THE CITY MAYOR</div>
          </div>
        </div>
        <div style="text-align:center;">
          <button class="print-btn" onclick="window.print()">Print Building Permit</button>
        </div>
      </div>
      <script>window.onload = () => { window.print(); };</script>
    </body>
    </html>
  `;
};

export const generateMotorelaPermitHTML = (permit: any): string => {
  const motorelaData = permit.motorelaData;
  
  const applicantName = permit.applicant
    ? `${permit.applicant.firstname || ''} ${permit.applicant.middlename || ''} ${permit.applicant.lastname || ''}`.trim() || 'N/A'
    : 'N/A';

  const operator = motorelaData?.operator || applicantName || 'N/A';
  const applicationNo = motorelaData?.application_no || permit.reference_code || permit.tracking_number || 'N/A';
  const plateNo = motorelaData?.plate_no || 'N/A';
  const bodyNo = motorelaData?.body_no || 'N/A';
  const chassisNo = motorelaData?.chassis_no || 'N/A';
  const motorNo = motorelaData?.motor_no || 'N/A';
  const make = motorelaData?.make || 'N/A';
  const route = motorelaData?.route || 'N/A';
  const operatorAddress = motorelaData?.operator_address || permit.applicant?.fulladdress || permit.address || 'N/A';
  const contact = motorelaData?.contact || permit.applicant?.contact_no || 'N/A';
  const driver = motorelaData?.driver || 'N/A';
  const driverAddress = motorelaData?.driver_address || 'N/A';

  const issuedDateSource = permit.approved_at || permit.updated_at || permit.created_at;
  const issuedDate = issuedDateSource ? new Date(issuedDateSource) : new Date();
  const issuedOn = issuedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const permitNo = motorelaData?.permit_no || motorelaData?.permit_number || applicationNo || permit.reference_code || permit.tracking_number || (typeof permit.id === 'string' ? permit.id.substring(0, 8) : 'N/A');

  const qrCodeSource =
    motorelaData?.qr_code_url ||
    motorelaData?.qrCodeUrl ||
    permit.qr_code_url ||
    `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(permitNo)}`;

  const cityLogoUrl =
    motorelaData?.city_logo_url ||
    motorelaData?.seal_url ||
    '/images/valencia-logo.png';

  const watermarkUrl =
    motorelaData?.watermark_url ||
    motorelaData?.watermarkUrl ||
    cityLogoUrl;

  const completedPayment = (permit.payments || []).find(
    (payment: any) => payment.payment_status === 'completed'
  );

  const officialReceipt =
    motorelaData?.or_number ||
    completedPayment?.payment_reference ||
    '__________';

  const amountPaid =
    motorelaData?.amount_paid ||
    (completedPayment?.amount
      ? `PHP ${Number(completedPayment.amount).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : '__________');

  const paymentDate =
    motorelaData?.or_date ||
    (completedPayment?.created_at
      ? new Date(completedPayment.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '__________');
  
  return `
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Motorela Permit</title>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;600;700;800&family=Roboto:wght@300;400;700&display=swap" rel="stylesheet">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html,body { height: 100%; background:#e9e9e9; font-family: "Roboto", Arial, sans-serif; -webkit-print-color-adjust: exact; }
        .page { width: 794px; margin: 18px auto; background: #fff; padding: 28px; border: 1px solid #cfcfcf; position: relative; overflow: hidden; }
        .page::after { content: ""; position: absolute; inset: 0; pointer-events: none; box-shadow: 0 0 0 2px rgba(0,0,0,0.02) inset; }
        .header { position: relative; display:flex; align-items:center; gap:18px; padding-bottom: 8px; margin-bottom: 8px; }
        .logo-wrap { width: 132px; height: 132px; position: relative; flex: 0 0 132px; }
        .logo { width: 100%; height: 100%; border-radius: 50%; background: #fff; display:flex; align-items:center; justify-content:center; overflow:hidden; border: 6px solid #f0f0f0; box-shadow: 0 0 0 6px rgba(0,0,0,0.00) inset; }
        .logo img { width: 86%; height: 86%; object-fit: contain; display:block; }
        .logo-wrap::before { content: ""; position: absolute; width: 232px; height: 232px; border-radius: 50%; left: -68px; top: -68px; border: 26px solid transparent; border-top-color: #9c1a1a; border-left-color: #9c1a1a; }
        .logo-wrap::after { content: ""; position: absolute; width: 190px; height: 190px; border-radius: 50%; left: -40px; top: -40px; border: 16px solid transparent; border-bottom-color: #0f7f4f; border-right-color: #0f7f4f; }
        .header-text { line-height: 1; z-index: 2; }
        .small-meta { font-size: 11px; color: #666; letter-spacing: .6px; margin-bottom: 6px; }
        .title { font-family: "Montserrat", "Arial", sans-serif; font-weight: 800; font-size: 40px; letter-spacing: 2px; margin-top: 4px; margin-bottom: 4px; }
        .sub-title { font-size: 12px; font-weight:700; color: #333; margin-top: -6px; }
        .green-band { height: 14px; background: #0f7f4f; margin-top: 6px; margin-bottom: 18px; border-radius: 2px; }
        .content-wrap { position: relative; display: grid; grid-template-columns: 1fr 260px; gap: 22px; align-items: start; }
        .watermark { pointer-events: none; position: absolute; inset: 140px 0 0 0; display:flex; justify-content:center; z-index: 0; opacity: 0.12; }
        .watermark img { width: 520px; height: auto; object-fit: contain; }
        .left { z-index: 2; padding-right: 6px; }
        .intro { font-size: 13px; color: #333; margin-bottom: 12px; }
        .holder-name { font-weight: 800; font-size: 18px; color: #111; margin-bottom: 8px; letter-spacing: .6px; text-transform: uppercase; }
        .label { font-weight:700; font-size:12px; color:#333; margin-top:8px; margin-bottom:4px; letter-spacing: .4px; }
        .value { font-size:13px; color:#444; margin-bottom:6px; }
        .issued { margin-top: 14px; font-size: 13px; color: #333; line-height: 1.35; }
        .issued p { margin-bottom: 6px; }
        .details-table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; }
        .details-table td { padding: 6px 8px; font-size: 12px; border: 1px solid #e3e3e3; }
        .details-table td:first-child { font-weight: 700; color: #333; background: #f8f8f8; width: 45%; }
        .details-table td:last-child { color: #444; }
        .right { z-index: 2; position: relative; }
        .qr-card { width: 100%; background: #fff; border: 1px solid #cfcfcf; padding: 12px; text-align: center; box-shadow: 0 1px 0 rgba(0,0,0,0.02); }
        .qr-card img { width: 140px; height:140px; object-fit:cover; display:block; margin: 0 auto 8px; }
        .qr-label { font-size:12px; font-weight:700; color:#333; letter-spacing: .6px; }
        .permit-small { margin-top: 18px; background: #fff; border: 1px solid #e3e3e3; padding: 10px; font-size: 12px; color: #333; line-height: 1.45; }
        .permit-small ul { margin-left: 18px; margin-top: 4px; }
        .permit-small li { margin-bottom: 6px; }
        .reminders { margin-top: 16px; border-top: 3px solid #9c1a1a; padding-top: 10px; font-size: 12px; color: #222; }
        .reminders h4 { color: #9c1a1a; font-weight: 700; font-size: 14px; margin-bottom: 6px; }
        .reminders ul { margin-left: 16px; margin-top:8px; }
        .reminders li { margin-bottom:6px; }
        .sig { margin-top: 32px; display:flex; justify-content: space-between; align-items: flex-end; z-index: 2; gap: 20px; }
        .sig-left { width: 58%; font-size: 12px; color:#555; }
        .sig-right { text-align:right; width: 42%; }
        .mayor-name { font-weight: 800; font-size: 15px; color:#111; }
        .byline { font-size: 11px; color:#666; margin-top:4px; }
        .print-btn { margin-top: 18px; display: inline-block; padding: 10px 18px; background: #198754; color: #fff; border-radius: 6px; border: 0; cursor: pointer; font-weight:700; font-size: 14px; }
        @media print { .print-btn { display:none; } body { background: #fff; } .page { border: none; margin: 0; width: auto; } }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div class="logo-wrap" aria-hidden="true">
            <div class="logo">
              <img src="${cityLogoUrl}" alt="City Logo">
            </div>
          </div>
          <div class="header-text">
            <div class="small-meta">REPUBLIC OF THE PHILIPPINES &nbsp;&nbsp;|&nbsp;&nbsp; PROVINCE OF BUKIDNON</div>
            <div class="title">MOTORELA PERMIT</div>
            <br>
            <div class="sub-title">OFFICE OF THE CITY MAYOR</div>
          </div>
        </div>
        <div class="green-band"></div>
        <div class="content-wrap">
          <div class="watermark">
            <img src="${watermarkUrl}" alt="watermark">
          </div>
          <div class="left">
            <br>
            <p class="intro">Pursuant to the provisions of the City's Traffic Code and other related ordinances, this PERMIT is hereby GRANTED to:</p>
            <div class="holder-name">${operator}</div>
            <div>
              <div class="label">APPLICATION NO.</div>
              <div class="value">${applicationNo}</div>
              <div class="label">OPERATOR</div>
              <div class="value">${operator}</div>
              <div class="label">OPERATOR ADDRESS</div>
              <div class="value">${operatorAddress}</div>
              <div class="label">CONTACT NUMBER</div>
              <div class="value">${contact}</div>
              <table class="details-table">
                <tr>
                  <td>Plate No</td>
                  <td>${plateNo}</td>
                </tr>
                <tr>
                  <td>Body No</td>
                  <td>${bodyNo}</td>
                </tr>
                <tr>
                  <td>Chassis No</td>
                  <td>${chassisNo}</td>
                </tr>
                <tr>
                  <td>Motor No</td>
                  <td>${motorNo}</td>
                </tr>
                <tr>
                  <td>Make</td>
                  <td>${make}</td>
                </tr>
                <tr>
                  <td>Route</td>
                  <td>${route}</td>
                </tr>
                <tr>
                  <td>Driver</td>
                  <td>${driver}</td>
                </tr>
                <tr>
                  <td>Driver Address</td>
                  <td>${driverAddress}</td>
                </tr>
              </table>
            </div>
            <div class="issued">
              <p><strong>ISSUED ON:</strong> ${issuedOn}</p>
              <p><strong>AT:</strong> CITY OF VALENCIA, BUKIDNON</p>
              <p style="margin-top:8px;">
                <strong>O.R. NO.:</strong> ${officialReceipt} &nbsp;&nbsp;
                <strong>AMOUNT:</strong> ${amountPaid} &nbsp;&nbsp;
                <strong>DATE:</strong> ${paymentDate}
              </p>
            </div>
          </div>
          <div class="right">
            <div class="qr-card">
              <img src="${qrCodeSource}" alt="QR Code">
              <div class="qr-label">PERMIT NO. ${permitNo}</div>
              <div style="font-size:11px;color:#666;margin-top:6px;">Present this permit for verification</div>
            </div>
            <div class="permit-small">
              <div style="font-weight:700;margin-bottom:6px;">This Permit is TEMPORARY / CONDITIONAL</div>
              <div style="font-size:12px;margin-bottom:6px;">Requires the following to be marked as complied:</div>
              <ul style="font-size:12px;">
                <li>VEHICLE REGISTRATION</li>
                <li>DRIVER'S LICENSE</li>
                <li>INSURANCE COVERAGE</li>
                <li>ROUTE CLEARANCE</li>
              </ul>
              <div style="margin-top:8px;font-size:11px;color:#666;">Present this permit to the Traffic Office for markings after clearances are completed.</div>
            </div>
            <div class="reminders">
              <h4>IMPORTANT REMINDERS</h4>
              <p style="font-size:12px;color:#333;">The permit is subject to conditions; non-compliance may result in penalties. Driver must comply with traffic rules and regulations.</p>
            </div>
          </div>
        </div>
        <div class="sig">
          <div class="sig-left">
            <div style="font-size:11px;color:#555;">ISSUED ON: ${issuedOn} — AT CITY OF VALENCIA, BUKIDNON</div>
          </div>
          <div class="sig-right">
            <div class="mayor-name">AMIE G. GALARIO</div>
            <div class="byline">CITY MAYOR<br>BY AUTHORITY OF THE CITY MAYOR</div>
          </div>
        </div>
        <div style="text-align:center;">
          <button class="print-btn" onclick="window.print()">Print Motorela Permit</button>
        </div>
      </div>
      <script>window.onload = () => { window.print(); };</script>
    </body>
    </html>
  `;
};

export const generateGenericPermitHTML = (permit: Permit, applicantName: string): string => {
  const permitTitle = permit.permit_type?.title || 'PERMIT';
  const permitId = permit.id;
  const address = permit.address || permit.applicant?.fulladdress || 'N/A';
  const status = permit.status || 'APPROVED';

  const issuedDateSource = permit.approved_at || permit.updated_at || permit.created_at;
  const issuedDate = issuedDateSource ? new Date(issuedDateSource) : new Date();
  const issuedOn = issuedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const permitNo = permit.reference_code || permit.tracking_number || (typeof permit.id === 'string' ? permit.id.substring(0, 8) : 'N/A');

  const qrCodeSource =
    permit.qr_code_url ||
    `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(permitNo)}`;

  const cityLogoUrl = '/images/valencia-logo.png';
  const watermarkUrl = cityLogoUrl;

  const completedPayment = (permit.payments || []).find(
    (payment: any) => payment.payment_status === 'completed'
  );

  const officialReceipt = completedPayment?.payment_reference || '__________';

  const amountPaid =
    completedPayment?.amount
      ? `PHP ${Number(completedPayment.amount).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : '__________';

  const paymentDate =
    completedPayment?.created_at
      ? new Date(completedPayment.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '__________';

  // Format details as a table if available
  let detailsTable = '';
  if (permit.details && Object.keys(permit.details).length > 0) {
    const detailsRows = Object.entries(permit.details)
      .map(([key, value]) => {
        const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value || 'N/A');
        return `<tr><td>${displayKey}</td><td>${displayValue}</td></tr>`;
      })
      .join('');
    detailsTable = `<table class="details-table">${detailsRows}</table>`;
  } else {
    detailsTable = '<p style="font-size:13px;color:#666;margin-top:8px;">No additional details provided.</p>';
  }

  return `
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>${permitTitle}</title>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;600;700;800&family=Roboto:wght@300;400;700&display=swap" rel="stylesheet">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html,body { height: 100%; background:#e9e9e9; font-family: "Roboto", Arial, sans-serif; -webkit-print-color-adjust: exact; }
        .page { width: 794px; margin: 18px auto; background: #fff; padding: 28px; border: 1px solid #cfcfcf; position: relative; overflow: hidden; }
        .page::after { content: ""; position: absolute; inset: 0; pointer-events: none; box-shadow: 0 0 0 2px rgba(0,0,0,0.02) inset; }
        .header { position: relative; display:flex; align-items:center; gap:18px; padding-bottom: 8px; margin-bottom: 8px; }
        .logo-wrap { width: 132px; height: 132px; position: relative; flex: 0 0 132px; }
        .logo { width: 100%; height: 100%; border-radius: 50%; background: #fff; display:flex; align-items:center; justify-content:center; overflow:hidden; border: 6px solid #f0f0f0; box-shadow: 0 0 0 6px rgba(0,0,0,0.00) inset; }
        .logo img { width: 86%; height: 86%; object-fit: contain; display:block; }
        .logo-wrap::before { content: ""; position: absolute; width: 232px; height: 232px; border-radius: 50%; left: -68px; top: -68px; border: 26px solid transparent; border-top-color: #9c1a1a; border-left-color: #9c1a1a; }
        .logo-wrap::after { content: ""; position: absolute; width: 190px; height: 190px; border-radius: 50%; left: -40px; top: -40px; border: 16px solid transparent; border-bottom-color: #0f7f4f; border-right-color: #0f7f4f; }
        .header-text { line-height: 1; z-index: 2; }
        .small-meta { font-size: 11px; color: #666; letter-spacing: .6px; margin-bottom: 6px; }
        .title { font-family: "Montserrat", "Arial", sans-serif; font-weight: 800; font-size: 40px; letter-spacing: 2px; margin-top: 4px; margin-bottom: 4px; }
        .sub-title { font-size: 12px; font-weight:700; color: #333; margin-top: -6px; }
        .green-band { height: 14px; background: #0f7f4f; margin-top: 6px; margin-bottom: 18px; border-radius: 2px; }
        .content-wrap { position: relative; display: grid; grid-template-columns: 1fr 260px; gap: 22px; align-items: start; }
        .watermark { pointer-events: none; position: absolute; inset: 140px 0 0 0; display:flex; justify-content:center; z-index: 0; opacity: 0.12; }
        .watermark img { width: 520px; height: auto; object-fit: contain; }
        .left { z-index: 2; padding-right: 6px; }
        .intro { font-size: 13px; color: #333; margin-bottom: 12px; }
        .holder-name { font-weight: 800; font-size: 18px; color: #111; margin-bottom: 8px; letter-spacing: .6px; text-transform: uppercase; }
        .label { font-weight:700; font-size:12px; color:#333; margin-top:8px; margin-bottom:4px; letter-spacing: .4px; }
        .value { font-size:13px; color:#444; margin-bottom:6px; }
        .issued { margin-top: 14px; font-size: 13px; color: #333; line-height: 1.35; }
        .issued p { margin-bottom: 6px; }
        .details-table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; }
        .details-table td { padding: 6px 8px; font-size: 12px; border: 1px solid #e3e3e3; }
        .details-table td:first-child { font-weight: 700; color: #333; background: #f8f8f8; width: 45%; }
        .details-table td:last-child { color: #444; }
        .right { z-index: 2; position: relative; }
        .qr-card { width: 100%; background: #fff; border: 1px solid #cfcfcf; padding: 12px; text-align: center; box-shadow: 0 1px 0 rgba(0,0,0,0.02); }
        .qr-card img { width: 140px; height:140px; object-fit:cover; display:block; margin: 0 auto 8px; }
        .qr-label { font-size:12px; font-weight:700; color:#333; letter-spacing: .6px; }
        .permit-small { margin-top: 18px; background: #fff; border: 1px solid #e3e3e3; padding: 10px; font-size: 12px; color: #333; line-height: 1.45; }
        .permit-small ul { margin-left: 18px; margin-top: 4px; }
        .permit-small li { margin-bottom: 6px; }
        .reminders { margin-top: 16px; border-top: 3px solid #9c1a1a; padding-top: 10px; font-size: 12px; color: #222; }
        .reminders h4 { color: #9c1a1a; font-weight: 700; font-size: 14px; margin-bottom: 6px; }
        .reminders ul { margin-left: 16px; margin-top:8px; }
        .reminders li { margin-bottom:6px; }
        .sig { margin-top: 32px; display:flex; justify-content: space-between; align-items: flex-end; z-index: 2; gap: 20px; }
        .sig-left { width: 58%; font-size: 12px; color:#555; }
        .sig-right { text-align:right; width: 42%; }
        .mayor-name { font-weight: 800; font-size: 15px; color:#111; }
        .byline { font-size: 11px; color:#666; margin-top:4px; }
        .print-btn { margin-top: 18px; display: inline-block; padding: 10px 18px; background: #198754; color: #fff; border-radius: 6px; border: 0; cursor: pointer; font-weight:700; font-size: 14px; }
        @media print { .print-btn { display:none; } body { background: #fff; } .page { border: none; margin: 0; width: auto; } }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div class="logo-wrap" aria-hidden="true">
            <div class="logo">
              <img src="${cityLogoUrl}" alt="City Logo">
            </div>
          </div>
          <div class="header-text">
            <div class="small-meta">REPUBLIC OF THE PHILIPPINES &nbsp;&nbsp;|&nbsp;&nbsp; PROVINCE OF BUKIDNON</div>
            <div class="title">${permitTitle.toUpperCase()}</div>
            <br>
            <div class="sub-title">OFFICE OF THE CITY MAYOR</div>
          </div>
        </div>
        <div class="green-band"></div>
        <div class="content-wrap">
          <div class="watermark">
            <img src="${watermarkUrl}" alt="watermark">
          </div>
          <div class="left">
            <br>
            <p class="intro">Pursuant to the provisions of the City's ordinances and regulations, this PERMIT is hereby GRANTED to:</p>
            <div class="holder-name">${applicantName}</div>
            <div>
              <div class="label">PERMIT ID</div>
              <div class="value">${permitId}</div>
              <div class="label">APPLICANT</div>
              <div class="value">${applicantName}</div>
              <div class="label">ADDRESS</div>
              <div class="value">${address}</div>
              <div class="label">STATUS</div>
              <div class="value">${status.toUpperCase()}</div>
              ${detailsTable ? `<div style="margin-top:12px;"><div class="label">PERMIT DETAILS</div>${detailsTable}</div>` : ''}
            </div>
            <div class="issued">
              <p><strong>ISSUED ON:</strong> ${issuedOn}</p>
              <p><strong>AT:</strong> CITY OF VALENCIA, BUKIDNON</p>
              <p style="margin-top:8px;">
                <strong>O.R. NO.:</strong> ${officialReceipt} &nbsp;&nbsp;
                <strong>AMOUNT:</strong> ${amountPaid} &nbsp;&nbsp;
                <strong>DATE:</strong> ${paymentDate}
              </p>
            </div>
          </div>
          <div class="right">
            <div class="qr-card">
              <img src="${qrCodeSource}" alt="QR Code">
              <div class="qr-label">PERMIT NO. ${permitNo}</div>
              <div style="font-size:11px;color:#666;margin-top:6px;">Present this permit for verification</div>
            </div>
            <div class="permit-small">
              <div style="font-weight:700;margin-bottom:6px;">This Permit is TEMPORARY / CONDITIONAL</div>
              <div style="font-size:12px;margin-bottom:6px;">Please comply with all applicable requirements and regulations.</div>
            </div>
            <div class="reminders">
              <h4>IMPORTANT REMINDERS</h4>
              <p style="font-size:12px;color:#333;">The permit is subject to conditions; non-compliance may result in penalties.</p>
            </div>
          </div>
        </div>
        <div class="sig">
          <div class="sig-left">
            <div style="font-size:11px;color:#555;">ISSUED ON: ${issuedOn} — AT CITY OF VALENCIA, BUKIDNON</div>
          </div>
          <div class="sig-right">
            <div class="mayor-name">AMIE G. GALARIO</div>
            <div class="byline">CITY MAYOR<br>BY AUTHORITY OF THE CITY MAYOR</div>
          </div>
        </div>
        <div style="text-align:center;">
          <button class="print-btn" onclick="window.print()">Print ${permitTitle}</button>
        </div>
      </div>
      <script>window.onload = () => { window.print(); };</script>
    </body>
    </html>
  `;
};
