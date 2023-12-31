const { getUser } = require('../utils/socket-utils/users');
const puppeteer = require('puppeteer');
const socketActions = require('../utils/socket-utils/socketActions');

//Site parameters
const params = {
  codeforces: {
    querySelector: `#pageContent > div.problemindexholder > div.ttypography`,
    wait: 0,
  },
  codechef: {
    querySelector:
      '#content-regions > section.content-area.small-8.columns.pl0',
    wait: 0,
  },
  geeksforgeeks: {
    querySelector: '#problems > div.problem-statement',
    wait: 500,
  },
  atcoder: {
    querySelector: '#task-statement > span > span.lang-en',
    wait: 500,
  },
  cses: {
    querySelector: 'body > div.skeleton > div.content-wrapper > div.content',
    wait: 2500,
  },
  codedrills: { querySelector: '.py-5', wait: 5000 },
};

module.exports = function (io) {
  try {
    io.on(socketActions.CONNECTION, (socket) => {
      socket.on(socketActions.CODEFORCES_PROBLEM, async (link) => {
        //get the room that user is in
        const sids = io.of('/').adapter.sids;
        const room = [...sids.get(socket.id)][1];
        //emit problem fetch message
        if (!room) {
          return;
        }
        socket.broadcast.to(room).emit(socketActions.CODEFORCES_PROBLEM);

        try {
          let problem = '';
          if (link == null || link == undefined) {
            console.log('link not defined');
          } else if (link.includes('codeforces.com')) {
            problem = await chromiumFetch('codeforces', link);
          } else if (link.includes('codechef.com')) {
            problem = await chromiumFetch('codechef', link);
          } else if (link.includes('geeksforgeeks.org')) {
            problem = await chromiumFetch('geeksforgeeks', link);
          } else if (link.includes('atcoder.jp')) {
            problem = await chromiumFetch('atcoder', link);
          } else if (link.includes('cses.fi')) {
            problem = await chromiumFetch('cses', link);
          } else if (link.includes('codedrills.io')) {
            problem = await chormiumFetch('codedrills', link);
          } else {
            problem = '';
          }

          const user = getUser(socket.id);
          if (!user) {
            return;
          }
          if (!problem) {
            problem = `<div className='error'>
          Please input correct url of the problem !<br/>And make sure Url is from following websites only: geeksforgeeks , codeforces , codechef , atcoder,cses, codeDrills
          </div>`;
          }
          io.to(user.room).emit(socketActions.PROBLEM, problem);
        } catch (e) {
          console.log(e);
        }
      });
    });
  } catch (e) {
    console.log(e);
  }
};

//Scrapping the problem from the selector after loading the page
async function chromiumFetch(site, URL) {
  try {
    const browser = await puppeteer.launch({
      // headless: true,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    // console.log(site);
    const page = await browser.newPage();
    await page.goto(URL);
    let text = '';

    await new Promise((r) => setTimeout(r, params[site].wait));

    text = await page.evaluate((q) => {
      return document.querySelector(q).outerHTML;
    }, params[site].querySelector);

    await browser.close();

    return text;
  } catch (e) {
    console.log(e);
  }

  return 'Error: Try again Later :( ';
}
