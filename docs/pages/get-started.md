# Getting started

This getting started describes how to install, load and use the trackthis api client.

## Install

The trackthis api client can be installed by either downloading the compiled files & loading them in your page or through [npm](https://npmjs.org).

To install via npm, run:

```sh
npm install --save trackthis-api-client
```

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

Once the api client has connected successfully, you can start using it like you would with any other platform specific api.

Setting global options:

```js
trackthisApi.setToken("super-secret-token-string");   // Token to be used in authenticated calls
trackthisApi.setClientId("the-id-of-your-app");       // Id of your application to identify itself
trackthisApi.setCallback("callback-url-of-your-app"); // The callback url of your application (must match the registered url)
```

Fetching a token to use for authenticated calls:

```js

// The displayed parameters here are the defaults
var parameters = {
  allowRedirect: true, // Show the trackthis login and/or the authorization page to the user if needed
  account      : null, // A string or list of usernames of known accounts or which you want to use
  clientId     : null, // The ID of your application
  callback     : null, // The callback url of your application
  scopes       : [     // A list of permissions you want to have
    
  ]
};

trackthisApi.getToken( parameters )
  .then(function( token ) {
    
  })
```