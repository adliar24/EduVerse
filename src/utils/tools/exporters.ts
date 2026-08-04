import { GroupResult } from '../../types/tools';

// Helper function untuk download yang ramah Mobile/WebView
export const robustSaveAs = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
};

export const exportToTxt = (groups: GroupResult[]) => {
  let content = '';
  groups.forEach((group) => {
    content += `=== ${group.name} ===\n`;
    group.members.forEach((member, index) => {
      content += `${index + 1}. ${member.name}\n`;
    });
    content += '\n';
  });

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  robustSaveAs(blob, 'pembagian-kelompok.txt');
};

export const exportToDocx = async (groups: GroupResult[]) => {
  const { Document, Packer, Paragraph, HeadingLevel, AlignmentType } = await import('docx');
  const children = [];

  // Title
  children.push(
    new Paragraph({
      text: "Hasil Pembagian Kelompok",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  groups.forEach((group) => {
    // Group Header
    children.push(
      new Paragraph({
        text: group.name,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );

    // Members
    group.members.forEach((member) => {
      children.push(
        new Paragraph({
          text: member.name,
          bullet: {
            level: 0,
          },
        })
      );
    });
    
    // Add empty line
    children.push(new Paragraph({}));
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  robustSaveAs(blob, 'pembagian-kelompok.docx');
};
