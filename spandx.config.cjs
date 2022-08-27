const fs = require('node:fs/promises');
const path = require('node:path');

/**
 * @param {import('node:http').ClientRequest} _req
 * @param {import('node:http').ServerResponse} res
 * @param {() => void} next
 */
async function injectLocalSources(_req, res, next) {
  try {
    const { write: origWrite } = res;

    res.write = function(chunk, ...rest) {
      if (res.getHeader('Content-Type').includes('text/html')) {
        if (chunk instanceof Buffer) {
          chunk = chunk.toString();
        }

        chunk = chunk
          .replace('</head>', `</head>`)
          .replace('</body>', `<script src="/src/proxy.js"></script><script src="/dist/bundle.js"></script>\n\n</body>`);

        // res.setHeader('Content-Length', chunk.length);
      }
      origWrite.apply(this, [chunk, ...rest]);
    };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  } finally {
    next();
  }
}

module.exports = {
  host: {
    local: 'localhost',
  },
  port: 'auto',
  open: !true,
  startPath: '/',
  verbose: false,
  routes: {
    // shut off web components bundle
    // '/sites/all/libraries/webrh/dist/js/webrh.webcomponents.min.js': '',
    '/en/solutions/models/': 'static/models/',
    '/dist/': 'dist/',
    '/src/proxy.js': 'src/proxy.js',
    '/': {
      host: 'https://www.redhat.com',
      watch: './'
    },
  },
  bs: {
    proxy: {
      target: 'https://www.redhat.com',
      middleware: [
        injectLocalSources,
      ],
    },
  },
};

