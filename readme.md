# Trackthis API client

This API client is the default provided for connecting with trackthis. The client contains everything needed to make full use of the TrackThis API.

## Installation

```sh
npm install --save trackthis-api-client
```

## Loading

#### Browser

```html
<!-- Self-hosted -->
<!-- uses define (AMD) or exports window.trackthisApi -->
<script src="path/to/browser.min.js"></script>

<!-- Rawgit cdn -->
<!-- uses define (AMD) or exports window.trackthisApi -->
<script src="https://cdn.rawgit.com/trackthis/js-api-client/<version>/lib/browser.min.js"></script>
```
```js
// RequireJS
// uses define
require.config({
  paths: {
    // ...
    'trackthis-api-client': 'path/to/browser.min.js'
    // ...
  }
})
```

#### NodeJS / Browserify

```js
var apiClient = require('trackthis-api-client');
```