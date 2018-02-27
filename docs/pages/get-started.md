# Getting started

This getting started describes how to install, load and use the trackthis api client.

## Install

The trackthis api client can be installed by either downloading the compiled files & loading them in your page or through [npm](https://npmjs.org).

To install via npm, run:

```sh
npm install --save trackthis-api-client
```

Alternatively you can [download](#download) the most recent version and host it yourself or use the rawgit cdn.

## Load

The trackthis api client can be used in node.js and in the browser. The library must be loaded and instantiated. When creating an instance, one can optionally provide configuration options as described later in this page.

#### Node.js

```js
// Load the api client
var trackthisApi = require('trackthis-api-client');

// Initialize the client & display the available versions
trackthisApi.connect()
  .then(function() {
    return trackthisApi.versions();
  })
  .then(function(availableVersions) {
    console.log(availableVersions);
  });
```

#### Browser

```html
<!DOCTYPE html>
<html>
  <head>
    <!-- You could also use the rawgit cdn -->
    <!-- https://cdn.rawgit.com/trackthis/js-api-client/<version>/lib/browser.min.js -->
    <script type="text/javascript" src="path/to/lib/browser.min.js"></script>
  </head>
  <body>
    <script type="text/javascript">
      // Initialize the client & display the available versions
      trackthisApi.connect()
        .then(function() {
          return trackthisApi.versions();
        })
        .then(function(availableVersions) {
          alert(JSON.stringify(availableVersions));
        })
    </script>
  </body>
</html>
```

#### Require.js

```js
require.config({
  paths: {
    'trackthis-api-client': 'path/to/browser.min.js',
  }
});
require(['trackthis-api-client'], function(trackthisApi) {
  // Initialize the client & display the available versions
  trackthisApi.connect()
    .then(function() {
    return trackthisApi.versions();
    })
    .then(function(availableVersions) {
    alert(JSON.stringify(availableVersions));
    })
});
```

## Use

Apart from the functions which set stuff like the tokens, client id & callback url, all functions return promises & have an optional callback parameter.

List of functions which do not return a promise

```js
trackthisApi.user.setToken("super-secret-token-string");     // Token to be used in authenticated calls
trackthisApi.setRefreshToken("super-secret-refresh-token");  // Refresh token to update the actual API token
trackthisApi.setClientId("the-id-of-your-app");              // Id of your application to identify itself
trackthisApi.setCallback("callback-url-of-your-app");        // The callback url of your application (must match the registered url)
```

