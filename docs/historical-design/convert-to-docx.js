const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, ExternalHyperlink,
  HeadingLevel, BorderStyle, WidthType, ShadingType, PageNumber, PageBreak
} = require("docx");

const DIR = __dirname;

const FILES = [
  "HISTORICAL_DESIGN_BRIEF.md",
  "ARCHAI_AND_HISTORICAL_DESIGN.md",
  "FIELD_SIGNALS_AND_KEY_TERMS.md",
  "INSTITUTIONAL_EXPECTATIONS_MAP.md",
  "ETHICS_APPLICATION_NOTES.md",
  "HCI_CORPUS_PLAN.md",
];

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };

function parseInlineFormatting(text) {
  const runs = [];
  // Split on bold (**...**) and links [...](...)
  const regex = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.slice(lastIndex, match.index), font: "Arial", size: 22 }));
    }
    if (match[1]) {
      runs.push(new TextRun({ text: match[1], bold: true, font: "Arial", size: 22 }));
    } else if (match[2] && match[3]) {
      runs.push(new ExternalHyperlink({
        children: [new TextRun({ text: match[2], style: "Hyperlink", font: "Arial", size: 22 })],
        link: match[3],
      }));
    } else if (match[4]) {
      runs.push(new TextRun({ text: match[4], font: "Courier New", size: 20, color: "333333" }));
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIndex), font: "Arial", size: 22 }));
  }
  if (runs.length === 0) {
    runs.push(new TextRun({ text: text, font: "Arial", size: 22 }));
  }
  return runs;
}

function parseMd(md) {
  const lines = md.split("\n");
  const children = [];
  let i = 0;
  let bulletRef = "bullets";
  let numberRef = "numbers";

  while (i < lines.length) {
    const line = lines[i];

    // Skip horizontal rules
    if (/^---+\s*$/.test(line)) { i++; continue; }

    // Empty line
    if (line.trim() === "") { i++; continue; }

    // Table detection
    if (i + 1 < lines.length && /^\|/.test(line) && /^\|[\s-:|]+\|/.test(lines[i + 1])) {
      const tableLines = [];
      let j = i;
      while (j < lines.length && /^\|/.test(lines[j])) {
        tableLines.push(lines[j]);
        j++;
      }
      // Parse header + separator + rows
      const header = tableLines[0];
      const dataRows = tableLines.slice(2); // skip separator
      const headerCells = header.split("|").filter(c => c.trim() !== "").map(c => c.trim());
      const numCols = headerCells.length;
      const tableWidth = 9360;
      const colWidth = Math.floor(tableWidth / numCols);
      const colWidths = Array(numCols).fill(colWidth);
      // Adjust last column to absorb rounding
      colWidths[numCols - 1] = tableWidth - colWidth * (numCols - 1);

      const rows = [];
      // Header row
      rows.push(new TableRow({
        children: headerCells.map((cell, ci) => new TableCell({
          borders,
          width: { size: colWidths[ci], type: WidthType.DXA },
          shading: { fill: "1B3A4B", type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({
            children: [new TextRun({ text: cell, bold: true, font: "Arial", size: 20, color: "FFFFFF" })],
          })],
        })),
      }));

      // Data rows
      dataRows.forEach((rowLine, ri) => {
        const cells = rowLine.split("|").filter(c => c.trim() !== "").map(c => c.trim());
        while (cells.length < numCols) cells.push("");
        rows.push(new TableRow({
          children: cells.map((cell, ci) => new TableCell({
            borders,
            width: { size: colWidths[ci], type: WidthType.DXA },
            shading: ri % 2 === 0 ? { fill: "F5F5F5", type: ShadingType.CLEAR } : undefined,
            margins: cellMargins,
            children: [new Paragraph({ children: parseInlineFormatting(cell) })],
          })),
        }));
      });

      children.push(new Table({
        width: { size: tableWidth, type: WidthType.DXA },
        columnWidths: colWidths,
        rows,
      }));
      children.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
      i = j;
      continue;
    }

    // Headings
    const h1 = line.match(/^# (.+)/);
    if (h1) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 360, after: 200 },
        children: [new TextRun({ text: h1[1], font: "Arial", size: 36, bold: true, color: "1B3A4B" })],
      }));
      i++; continue;
    }
    const h2 = line.match(/^## (.+)/);
    if (h2) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 160 },
        children: [new TextRun({ text: h2[1], font: "Arial", size: 30, bold: true, color: "2E5A6B" })],
      }));
      i++; continue;
    }
    const h3 = line.match(/^### (.+)/);
    if (h3) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 240, after: 120 },
        children: [new TextRun({ text: h3[1], font: "Arial", size: 26, bold: true, color: "3A7A8C" })],
      }));
      i++; continue;
    }
    const h4 = line.match(/^#### (.+)/);
    if (h4) {
      children.push(new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [new TextRun({ text: h4[1], font: "Arial", size: 24, bold: true, color: "4A8A9C" })],
      }));
      i++; continue;
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      children.push(new Paragraph({
        numbering: { reference: numberRef, level: 0 },
        spacing: { after: 60 },
        children: parseInlineFormatting(numMatch[2]),
      }));
      i++; continue;
    }

    // Bullet list (- or *)
    const bulletMatch = line.match(/^[-*]\s+(.+)/);
    if (bulletMatch) {
      children.push(new Paragraph({
        numbering: { reference: bulletRef, level: 0 },
        spacing: { after: 60 },
        children: parseInlineFormatting(bulletMatch[1]),
      }));
      i++; continue;
    }

    // Sub-bullet (  - or   -)
    const subBulletMatch = line.match(/^\s{2,}[-*]\s+(.+)/);
    if (subBulletMatch) {
      children.push(new Paragraph({
        numbering: { reference: bulletRef, level: 1 },
        spacing: { after: 40 },
        children: parseInlineFormatting(subBulletMatch[1]),
      }));
      i++; continue;
    }

    // Code block
    if (line.startsWith("```")) {
      i++;
      const codeLines = [];
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      children.push(new Paragraph({
        spacing: { before: 80, after: 80 },
        shading: { fill: "F0F0F0", type: ShadingType.CLEAR },
        children: [new TextRun({ text: codeLines.join("\n"), font: "Courier New", size: 18, color: "333333" })],
      }));
      continue;
    }

    // Block quote
    if (line.startsWith("> ")) {
      const quoteText = line.slice(2);
      children.push(new Paragraph({
        spacing: { before: 120, after: 120 },
        indent: { left: 720 },
        border: { left: { style: BorderStyle.SINGLE, size: 6, color: "3A7A8C", space: 8 } },
        children: [new TextRun({ text: quoteText, italics: true, font: "Arial", size: 22, color: "555555" })],
      }));
      i++; continue;
    }

    // Regular paragraph
    children.push(new Paragraph({
      spacing: { after: 120 },
      children: parseInlineFormatting(line),
    }));
    i++;
  }

  return children;
}

async function convertFile(filename) {
  const mdPath = path.join(DIR, filename);
  const md = fs.readFileSync(mdPath, "utf-8");
  const content = parseMd(md);

  // Extract title from first heading
  const titleMatch = md.match(/^# (.+)/m);
  const title = titleMatch ? titleMatch[1] : filename.replace(".md", "");

  const doc = new Document({
    creator: "Rob Graham",
    title: title,
    description: "ARCHAI PhD Research Document",
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 22 },
        },
      },
      paragraphStyles: [
        {
          id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 36, bold: true, font: "Arial", color: "1B3A4B" },
          paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
        },
        {
          id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 30, bold: true, font: "Arial", color: "2E5A6B" },
          paragraph: { spacing: { before: 300, after: 160 }, outlineLevel: 1 },
        },
        {
          id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 26, bold: true, font: "Arial", color: "3A7A8C" },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
            { level: 1, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
          ],
        },
        {
          reference: "numbers",
          levels: [
            { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          ],
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "ARCHAI — Rob Graham — RMIT Design PhD", font: "Arial", size: 16, color: "999999" })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Page ", font: "Arial", size: 16, color: "999999" }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: "999999" }),
            ],
          })],
        }),
      },
      children: content,
    }],
  });

  const outPath = path.join(DIR, filename.replace(".md", ".docx"));
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buffer);
  console.log(`Created: ${outPath} (${Math.round(buffer.length / 1024)} KB)`);
}

async function main() {
  for (const f of FILES) {
    try {
      await convertFile(f);
    } catch (err) {
      console.error(`ERROR converting ${f}: ${err.message}`);
    }
  }
  console.log("\nDone. All Word files saved alongside the markdown files.");
}

main();
