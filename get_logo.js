fetch('https://www.trytoku.com')
  .then(res => res.text())
  .then(text => {
    const matches = text.match(/src="([^"]*\.(?:svg|png|jpg|jpeg|webp))"/gi);
    console.log(matches);
  });
