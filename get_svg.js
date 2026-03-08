fetch('https://www.trytoku.com')
  .then(res => res.text())
  .then(text => {
    const matches = text.match(/<svg[^>]*>.*?<\/svg>/gi);
    if (matches) {
      matches.forEach((m, i) => {
        if (m.includes('toku') || m.includes('logo')) {
          console.log(`SVG ${i}:`, m.substring(0, 100) + '...');
        }
      });
    }
  });
