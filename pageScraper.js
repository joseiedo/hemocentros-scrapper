const fs = require('fs');

const scraperObject = {
  url: 'https://www.gov.br/saude/pt-br/acesso-a-informacao/acoes-e-programas/doacao-de-sangue/hemocentros-no-brasil',

  async scraper(browser) {
    let page = await browser.newPage();
    console.log(`Navigating to ${this.url}...`);

    await page.goto(this.url);

    await page.click('body');

    await page.waitForSelector('#main-content');

    const hemocenters = await page.$$eval(
      'div#parent-fieldname-text > *',
      (elements) => {
        let currentRegion = '';
        const regions = ['nordeste', 'centro-oeste', 'norte', 'sudeste', 'sul'];

        return elements.reduce((acc, el) => {
          const isRegionName = regions.includes(el.textContent.toLowerCase());

          if (isRegionName) {
            currentRegion = el.innerText.toLowerCase();
            return {
              ...acc,
              [currentRegion]: [],
            };
          }

          return {
            ...acc,
            [currentRegion]: [...acc[currentRegion], el.innerText],
          };
        }, {});
      }
    );

    const formattedHemocenters = formatHemocenters(hemocenters);

    browser.close();

    const json = JSON.stringify(Object.fromEntries(formattedHemocenters));

    saveFile('hemocenters.json', json);
  },
};

function formatHemocenters(hemocenters) {
  return Object.entries(hemocenters).map(([region, hemocenters]) => {
    const formattedHemocenters = [];

    while (formattedHemocenters.length < Math.round(hemocenters.length / 2)) {
      const [hemocenter, infos] = hemocenters.slice(0, 2);

      formattedHemocenters.push({
        nome: hemocenter,
        ...Object.fromEntries(formatHemocenterInfos(infos.split('\n'))),
        regiao: region,
      });
    }

    return [region, formattedHemocenters];
  });
}

function formatHemocenterInfos(currentInfos) {
  const neededInfosLabels = ['Endereço', 'CEP', 'Telefone', 'E-mail'];

  return neededInfosLabels.map((infoLabel) => {
    const [label, data] = currentInfos
      .find((inf) => inf.startsWith(infoLabel))
      .replace(': ', '/break')
      .split('/break');

    return [label.toLowerCase(), data];
  });
}

function saveFile(fileName, file) {
  fs.writeFile(fileName, file, (err) => {
    if (err) console.log('Was not possible to save this file => ', err);
    else console.log('Saved sucessfully!');
  });
}

module.exports = scraperObject;
