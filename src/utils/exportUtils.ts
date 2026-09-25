import { SurveyResponse } from '../types/nps';
import { getClassificationLabel } from '../services/npsCalculator';

export function exportToCSV(responses: SurveyResponse[], filename = 'nps_respostas.csv') {
  if (!responses || responses.length === 0) {
    alert('Nenhuma resposta disponível para exportação.');
    return;
  }

  // Find all unique question texts to create dynamic columns
  const allQuestionTexts: string[] = [];
  responses.forEach((r) => {
    r.answers.forEach((ans) => {
      if (!allQuestionTexts.includes(ans.question_text)) {
        allQuestionTexts.push(ans.question_text);
      }
    });
  });

  const headers = [
    'ID Resposta',
    'Código Cliente',
    'Nome Cliente',
    'E-mail Cliente',
    'Telefone Cliente',
    'Pesquisa',
    'Nota NPS',
    'Classificação',
    'Data e Hora',
    'Token',
    ...allQuestionTexts,
  ];

  const escapeCSV = (value: any) => {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = responses.map((r) => {
    const formattedDate = new Date(r.created_at).toLocaleString('pt-BR');
    const classLabel = getClassificationLabel(r.classification);

    const questionValues = allQuestionTexts.map((qText) => {
      const found = r.answers.find((a) => a.question_text === qText);
      return found ? found.value : '';
    });

    return [
      escapeCSV(r.id),
      escapeCSV(r.customer_code),
      escapeCSV(r.customer_name),
      escapeCSV(r.customer_email),
      escapeCSV(r.customer_phone || '-'),
      escapeCSV(r.survey_title),
      escapeCSV(r.nps_score),
      escapeCSV(classLabel),
      escapeCSV(formattedDate),
      escapeCSV(r.token),
      ...questionValues.map(escapeCSV),
    ].join(';');
  });

  // UTF-8 BOM for Excel compatibility
  const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToExcel(responses: SurveyResponse[], filename = 'nps_respostas.xls') {
  if (!responses || responses.length === 0) {
    alert('Nenhuma resposta disponível para exportação.');
    return;
  }

  const allQuestionTexts: string[] = [];
  responses.forEach((r) => {
    r.answers.forEach((ans) => {
      if (!allQuestionTexts.includes(ans.question_text)) {
        allQuestionTexts.push(ans.question_text);
      }
    });
  });

  const headerCells = [
    'ID Resposta',
    'Código Cliente',
    'Nome Cliente',
    'E-mail',
    'Telefone',
    'Pesquisa',
    'Nota NPS',
    'Classificação',
    'Data/Hora',
    'Token',
    ...allQuestionTexts,
  ]
    .map((h) => `<th style="background-color: #1e293b; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px;">${h}</th>`)
    .join('');

  const bodyRows = responses
    .map((r) => {
      const formattedDate = new Date(r.created_at).toLocaleString('pt-BR');
      const classLabel = getClassificationLabel(r.classification);
      const rowColor =
        r.classification === 'promoter'
          ? '#f0fdf4'
          : r.classification === 'passive'
          ? '#fffbeb'
          : '#fef2f2';

      const questionTds = allQuestionTexts
        .map((qText) => {
          const found = r.answers.find((a) => a.question_text === qText);
          const val = found ? found.value : '';
          return `<td style="border: 1px solid #cbd5e1; padding: 6px;">${val}</td>`;
        })
        .join('');

      return `
        <tr style="background-color: ${rowColor};">
          <td style="border: 1px solid #cbd5e1; padding: 6px;">${r.id}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">${r.customer_code}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px;">${r.customer_name}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px;">${r.customer_email}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px;">${r.customer_phone || '-'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px;">${r.survey_title}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: bold;">${r.nps_score}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">${classLabel}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px;">${formattedDate}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-family: monospace;">${r.token}</td>
          ${questionTds}
        </tr>
      `;
    })
    .join('');

  const tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Resultados NPS</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
    </head>
    <body>
      <table>
        <thead>
          <tr>${headerCells}</tr>
        </thead>
        <tbody>
          ${bodyRows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface CustomerExportItem {
  code: string;
  name: string;
  phone: string;
  email: string;
  surveyTitle: string;
  token: string;
  surveyLink: string;
  status: string;
  smsMessage: string;
}

export function exportCustomersToExcel(items: CustomerExportItem[], filename = 'clientes_links_nps_sms.xls') {
  if (!items || items.length === 0) {
    alert('Nenhum cliente para exportar.');
    return;
  }

  const headers = [
    'Código do Cliente',
    'Nome do Cliente',
    'Telefone / Celular (SMS)',
    'E-mail',
    'Pesquisa NPS',
    'Token Único',
    'Link Completo da Pesquisa',
    'Status da Resposta',
    'Sugestão de Mensagem SMS Pronta',
  ];

  const headerCells = headers
    .map((h) => `<th style="background-color: #1e293b; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 10px; font-size: 12px;">${h}</th>`)
    .join('');

  const bodyRows = items
    .map((item, idx) => {
      const bgColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      const statusColor = item.status === 'Respondido' ? '#059669' : '#d97706';
      
      return `
        <tr style="background-color: ${bgColor}; font-size: 11px;">
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; font-family: monospace;">${item.code}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: 500;">${item.name}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-family: monospace; mso-number-format:'\\@';">${item.phone || '-'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px;">${item.email}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px;">${item.surveyTitle}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-family: monospace;">${item.token}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-family: monospace; color: #2563eb;">${item.surveyLink}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: ${statusColor}; text-align: center;">${item.status}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-style: italic; background-color: #f1f5f9;">${item.smsMessage}</td>
        </tr>
      `;
    })
    .join('');

  const tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Links SMS Clientes NPS</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
    </head>
    <body>
      <table>
        <thead>
          <tr>${headerCells}</tr>
        </thead>
        <tbody>
          ${bodyRows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportCustomersToCSV(items: CustomerExportItem[], filename = 'clientes_links_nps_sms.csv') {
  if (!items || items.length === 0) {
    alert('Nenhum cliente para exportar.');
    return;
  }

  const escapeCSV = (value: any) => {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headers = [
    'Código Cliente',
    'Nome Cliente',
    'Telefone SMS',
    'E-mail',
    'Pesquisa',
    'Token',
    'Link da Pesquisa',
    'Status',
    'Mensagem SMS Sugerida',
  ];

  const rows = items.map((i) => [
    escapeCSV(i.code),
    escapeCSV(i.name),
    escapeCSV(i.phone),
    escapeCSV(i.email),
    escapeCSV(i.surveyTitle),
    escapeCSV(i.token),
    escapeCSV(i.surveyLink),
    escapeCSV(i.status),
    escapeCSV(i.smsMessage),
  ].join(';'));

  const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
