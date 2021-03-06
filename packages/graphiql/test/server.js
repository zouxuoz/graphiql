/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-console */
import express from 'express';
import path from 'path';
import browserify from 'browserify';
import browserifyShim from 'browserify-shim';
import watchify from 'watchify';
import babelify from 'babelify';
import graphqlHTTP from 'express-graphql';
import fs from 'fs'
import schema from './schema';
 


const app = express();
// Server
app.use('/graphql', graphqlHTTP({ schema }));

// Client
let bundleBuffer;

const b = browserify({
  entries: [path.join(__dirname, '../src/index.js')],
  cache: {},
  packageCache: {},
  transform: [[babelify], browserifyShim],
  plugin: [watchify],
  standalone: 'GraphiQL',
  globalTransform: 'browserify-shim',
});

b.on('update', () => makeBundle());
b.on('log', msg => console.log(`graphiql.js: ${msg}`));

function makeBundle(callback) {
  b.bundle((err, buffer) => {
    if (err) {
      console.error('Error building graphiql.js');
      console.error(err);
      return;
    }
    bundleBuffer = buffer;
    // eslint-disable-next-line no-unused-expressions
    callback && callback();
  });
}

app.use('/graphiql.js', (req, res) => {
  res.end(bundleBuffer);
});

app.use('/css', express.static(path.join(__dirname, '../css')));
app.use(express.static(__dirname));

console.log('Initial build...');
makeBundle(() => {
  app.listen(process.env.PORT || 0, function() {
    const port = this.address().port;
    console.log('PID', process.pid)
    fs.writeFile(path.join(__dirname, 'pid'), parseInt(process.pid, 10), () => {
      console.log(`Started on http://localhost:${port}/`);
    }) 
    process.once('SIGINT', () => {
      process.exit()
    })
    process.once('SIGTERM', () => {
      process.exit()
    })
  });
});
