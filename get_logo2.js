fetch('https://www.trytoku.com')
  .then(res => res.text())
  .then(text => {
    const matches = text.match(/https:\/\/trytoku\.com\/[^"'\s]*logo[^"'\s]*\.(?:png|svg|jpg)/gi);
    console.log(matches);
  });
