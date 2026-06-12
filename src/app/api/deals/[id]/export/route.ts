import { NextRequest, NextResponse } from "next/server";
import ExcelJS from 'exceljs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Feasibility');

    sheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 }
    ];

    sheet.addRows([
      { metric: 'Project Address', value: body.projectAddress },
      { metric: 'Customer Group', value: body.customerGroup },
      { metric: 'GRV', value: body.results.grv },
      { metric: 'ROC', value: body.results.roc },
      { metric: 'LVR Gross', value: body.results.lvrGross },
      { metric: 'Senior Funding', value: body.results.seniorFunding }
    ]);

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="feasibility.xlsx"'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
