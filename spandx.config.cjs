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
          .replace('</head>', `<link type="text/css" href="/style.css"></link></head>`)
          .replace('</body>', `<script async src="https://unpkg.com/es-module-shims@1.3.6/dist/es-module-shims.js"></script>
  <script type="importmap">
    {
      "imports": {
        "three": "https://unpkg.com/three/build/three.module.js",
        "three/examples/jsm/controls/OrbitControls.js": "https://unpkg.com/three@0.143.0/examples/jsm/controls/OrbitControls.js",
        "three/examples/jsm/loaders/GLTFLoader.js": "https://unpkg.com/three@0.143.0/examples/jsm/loaders/GLTFLoader.js",
        "three/examples/jsm/loaders/DRACOLoader.js": "https://unpkg.com/three@0.143.0/examples/jsm/loaders/DRACOLoader.js",
        "three/examples/jsm/environments/RoomEnvironment.js": "https://unpkg.com/three@0.143.0/examples/jsm/environments/RoomEnvironment.js",
        "lil-gui": "https://unpkg.com/lil-gui@0.17.0/dist/lil-gui.esm.js",
        "gsap": "https://unpkg.com/gsap@3.11.0/index.js",
        "lit": "https://unpkg.com/lit?module"
      }
    }
  </script>
  <script type="module" src="./script.js"></script>
  <script type="module" src="./proxy.js"></script>
\n\n</body>`);

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
    '/en/solutions/models/': 'models/',
    '/en/solutions/script.js': 'script.js',
    '/en/solutions/proxy.js': 'proxy.js',
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

